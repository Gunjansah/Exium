import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { ExamResponse, ExamWithDetails, Question, MultipleChoiceQuestion, ShortAnswerQuestion, LongAnswerQuestion, TrueFalseQuestion, MatchingQuestion, CodingQuestion } from '@/types/exam'
import { z } from 'zod'
import { ExamStatus, SecurityLevel, Prisma, QuestionType } from '@prisma/client'

const updateExamSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  startTime: z.date().nullable().optional(),
  endTime: z.date().nullable().optional(),
  status: z.nativeEnum(ExamStatus).optional(),
  // Security Settings
  securityLevel: z.nativeEnum(SecurityLevel).optional(),
  maxViolations: z.number().min(1).optional(),
  // Security Features
  fullScreenMode: z.boolean().optional(),
  blockMultipleTabs: z.boolean().optional(),
  blockKeyboardShortcuts: z.boolean().optional(),
  blockRightClick: z.boolean().optional(),
  blockClipboard: z.boolean().optional(),
  browserMonitoring: z.boolean().optional(),
  blockSearchEngines: z.boolean().optional(),
  resumeCount: z.number().min(1).optional(),
  webcamRequired: z.boolean().optional(),
  deviceTracking: z.boolean().optional(),
  screenshotBlocking: z.boolean().optional(),
  periodicUserValidation: z.boolean().optional(),
})

// Define the Prisma include type
type ExamWithIncludes = Prisma.ExamGetPayload<{
  include: {
    teacher: {
      select: {
        firstName: true
        lastName: true
        email: true
      }
    }
    class: {
      select: {
        name: true
      }
    }
    questions: true
    _count: {
      select: {
        enrollments: true
        submissions: true
        questions: true
      }
    }
  }
}>

// GET /api/teacher/exams/[examId] - Get a single exam
export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
): Promise<NextResponse<ExamResponse>> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
        createdBy: session.user.id,
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        _count: {
          select: {
            enrollments: true,
            submissions: true,
            questions: true,
          },
        },
      },
    })

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Transform the exam data to match ExamWithDetails type
    const examData = {
      id: exam.id,
      title: exam.title,
      description: exam.description || '',
      duration: exam.duration,
      startTime: exam.startTime,
      endTime: exam.endTime,
      status: exam.status,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      classId: exam.classId,
      createdBy: exam.createdBy,
      securityLevel: exam.securityLevel,
      maxViolations: exam.maxViolations,
      fullScreenMode: exam.fullScreenMode,
      blockMultipleTabs: exam.blockMultipleTabs,
      blockKeyboardShortcuts: exam.blockKeyboardShortcuts,
      blockRightClick: exam.blockRightClick,
      blockClipboard: exam.blockClipboard,
      browserMonitoring: exam.browserMonitoring,
      blockSearchEngines: exam.blockSearchEngines,
      resumeCount: exam.resumeCount,
      webcamRequired: exam.webcamRequired,
      deviceTracking: exam.deviceTracking,
      screenshotBlocking: exam.screenshotBlocking,
      periodicUserValidation: exam.periodicUserValidation,
      teacher: {
        name: exam.teacher.firstName && exam.teacher.lastName 
          ? `${exam.teacher.firstName} ${exam.teacher.lastName}`
          : null,
        email: exam.teacher.email,
      },
      class: {
        name: exam.class.name,
      },
      questions: exam.questions.map(q => {
        const baseQuestion = {
          id: q.id,
          type: q.type,
          difficulty: q.difficulty,
          points: q.points,
          content: q.content,
          orderIndex: q.orderIndex,
          timeLimit: q.timeLimit || null,
          explanation: q.explanation || null,
        }

        switch (q.type) {
          case 'MULTIPLE_CHOICE':
            return {
              ...baseQuestion,
              type: 'MULTIPLE_CHOICE' as const,
              options: q.options ? JSON.parse(q.options as string) : [],
            }

          case 'SHORT_ANSWER':
            return {
              ...baseQuestion,
              type: 'SHORT_ANSWER' as const,
              correctAnswer: q.correctAnswer || '',
            }

          case 'LONG_ANSWER':
            return {
              ...baseQuestion,
              type: 'LONG_ANSWER' as const,
              rubric: q.rubric || '',
            }

          case 'TRUE_FALSE':
            return {
              ...baseQuestion,
              type: 'TRUE_FALSE' as const,
              correctAnswer: q.correctAnswer as 'true' | 'false',
            }

          case 'MATCHING':
            return {
              ...baseQuestion,
              type: 'MATCHING' as const,
              matchingPairs: q.options ? JSON.parse(q.options as string) : [],
            }

          case 'CODING':
            return {
              ...baseQuestion,
              type: 'CODING' as const,
              programmingLanguage: 'javascript', // Default to javascript if not specified
              codeTemplate: q.codeTemplate || '',
              testCases: q.testCases ? JSON.parse(q.testCases as string) : [],
            }

          default:
            throw new Error(`Unsupported question type: ${q.type}`)
        }
      }),
      _count: exam._count,
    } satisfies ExamWithDetails

    return NextResponse.json({ success: true, data: examData })
  } catch (error) {
    console.error('Failed to get exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get exam' },
      { status: 500 }
    )
  }
}

// PATCH /api/teacher/exams/[examId] - Update an exam
export async function PATCH(
  request: Request,
  { params }: { params: { examId: string } }
): Promise<NextResponse<ExamResponse>> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the exam exists and belongs to the teacher
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
        createdBy: user.id,
      },
    })

    if (!existingExam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    const json = await request.json()
    const validatedData = updateExamSchema.parse({
      ...json,
      startTime: json.startTime ? new Date(json.startTime) : undefined,
      endTime: json.endTime ? new Date(json.endTime) : undefined,
    })

    const exam = await prisma.exam.update({
      where: {
        id: params.examId,
      },
      data: validatedData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            enrollments: true,
            submissions: true,
          },
        },
      },
    })

    // Transform the exam data to match ExamWithDetails type
    const examData: Partial<ExamWithDetails> = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      startTime: exam.startTime,
      endTime: exam.endTime,
      status: exam.status,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      classId: exam.classId,
      createdBy: exam.createdBy,
      securityLevel: exam.securityLevel,
      maxViolations: exam.maxViolations,
      fullScreenMode: exam.fullScreenMode,
      blockMultipleTabs: exam.blockMultipleTabs,
      blockKeyboardShortcuts: exam.blockKeyboardShortcuts,
      blockRightClick: exam.blockRightClick,
      blockClipboard: exam.blockClipboard,
      browserMonitoring: exam.browserMonitoring,
      blockSearchEngines: exam.blockSearchEngines,
      resumeCount: exam.resumeCount,
      webcamRequired: exam.webcamRequired,
      deviceTracking: exam.deviceTracking,
      screenshotBlocking: exam.screenshotBlocking,
      periodicUserValidation: exam.periodicUserValidation,
      teacher: {
        name: exam.teacher.firstName && exam.teacher.lastName 
          ? `${exam.teacher.firstName} ${exam.teacher.lastName}`
          : null,
        email: exam.teacher.email,
      },
      _count: exam._count,
    }

    return NextResponse.json({ success: true, data: examData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Failed to update exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update exam' },
      { status: 500 }
    )
  }
}

// DELETE /api/teacher/exams/[examId] - Delete an exam
export async function DELETE(
  request: Request,
  { params }: { params: { examId: string } }
): Promise<NextResponse<ExamResponse>> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the exam exists and belongs to the teacher
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
        createdBy: user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            enrollments: true,
            submissions: true,
          },
        },
      },
    })

    if (!existingExam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    await prisma.exam.delete({
      where: {
        id: params.examId,
      },
    })

    // Transform the exam data to match ExamWithDetails type
    const examData: Partial<ExamWithDetails> = {
      id: existingExam.id,
      title: existingExam.title,
      description: existingExam.description,
      duration: existingExam.duration,
      startTime: existingExam.startTime,
      endTime: existingExam.endTime,
      status: existingExam.status,
      createdAt: existingExam.createdAt,
      updatedAt: existingExam.updatedAt,
      classId: existingExam.classId,
      createdBy: existingExam.createdBy,
      securityLevel: existingExam.securityLevel,
      maxViolations: existingExam.maxViolations,
      fullScreenMode: existingExam.fullScreenMode,
      blockMultipleTabs: existingExam.blockMultipleTabs,
      blockKeyboardShortcuts: existingExam.blockKeyboardShortcuts,
      blockRightClick: existingExam.blockRightClick,
      blockClipboard: existingExam.blockClipboard,
      browserMonitoring: existingExam.browserMonitoring,
      blockSearchEngines: existingExam.blockSearchEngines,
      resumeCount: existingExam.resumeCount,
      webcamRequired: existingExam.webcamRequired,
      deviceTracking: existingExam.deviceTracking,
      screenshotBlocking: existingExam.screenshotBlocking,
      periodicUserValidation: existingExam.periodicUserValidation,
      teacher: {
        name: existingExam.teacher.firstName && existingExam.teacher.lastName 
          ? `${existingExam.teacher.firstName} ${existingExam.teacher.lastName}`
          : null,
        email: existingExam.teacher.email,
      },
      _count: existingExam._count,
    }

    return NextResponse.json({ success: true, data: examData })
  } catch (error) {
    console.error('Failed to delete exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete exam' },
      { status: 500 }
    )
  }
}
