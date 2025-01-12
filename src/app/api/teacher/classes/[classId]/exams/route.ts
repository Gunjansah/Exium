import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { QuestionType, DifficultyLevel, ExamStatus, SecurityLevel } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { getExamDraft, deleteExamDraft } from '@/lib/redis'

const questionTypes = [
  'MULTIPLE_CHOICE',
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'TRUE_FALSE',
  'MATCHING',
  'CODING',
] as const

const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  timeLimit: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  isPublished: z.boolean().default(false),
  questions: z.array(z.object({
    type: z.enum(questionTypes),
    content: z.string().min(1, 'Question content is required'),
    points: z.number().min(1, 'Points must be at least 1'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })).optional(),
    correctAnswer: z.string().optional(),
    rubric: z.string().optional(),
    matchingPairs: z.array(z.object({
      left: z.string().min(1, 'Left side is required'),
      right: z.string().min(1, 'Right side is required'),
    })).optional(),
    codeTemplate: z.string().optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string().min(1, 'Expected output is required'),
      isHidden: z.boolean(),
      explanation: z.string().optional(),
    })).optional(),
    programmingLanguage: z.string().optional(),
  })).min(1, 'At least one question is required'),
  // Security settings
  blockClipboard: z.boolean().default(true),
  blockKeyboardShortcuts: z.boolean().default(true),
  blockMultipleTabs: z.boolean().default(true),
  blockRightClick: z.boolean().default(true),
  blockSearchEngines: z.boolean().default(true),
  browserMonitoring: z.boolean().default(true),
  deviceTracking: z.boolean().default(true),
  fullScreenMode: z.boolean().default(true),
  maxViolations: z.number().min(1).default(3),
  periodicUserValidation: z.boolean().default(true),
  resumeCount: z.number().min(1).default(1),
  screenshotBlocking: z.boolean().default(true),
  securityLevel: z.enum(['STANDARD', 'HIGH', 'CUSTOM']).default('STANDARD'),
  webcamRequired: z.boolean().default(false),
})

export async function POST(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classId = params.classId
    const teacherClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: user.id,
      },
    })

    if (!teacherClass) {
      return Response.json(
        { error: 'Class not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get exam data from Redis draft or request body
    let examData
    const body = await req.json()
    
    if (body.fromDraft) {
      // If creating from draft, get the draft data
      examData = await getExamDraft(user.id)
      if (!examData) {
        return Response.json(
          { error: 'No draft found' },
          { status: 404 }
        )
      }
    } else {
      // If not from draft, validate the request body
      examData = createExamSchema.parse(body)
    }

    // Create the exam and its questions in a transaction
    const exam = await prisma.$transaction(async (tx) => {
      // Create the exam
      const exam = await tx.exam.create({
        data: {
          title: examData.title,
          description: examData.description,
          duration: examData.timeLimit || 0,
          status: examData.isPublished ? ExamStatus.PUBLISHED : ExamStatus.DRAFT,
          classId: classId,
          createdBy: user.id,
          securityLevel: examData.securityLevel,
          maxViolations: examData.maxViolations,
          blockClipboard: examData.blockClipboard,
          blockKeyboardShortcuts: examData.blockKeyboardShortcuts,
          blockMultipleTabs: examData.blockMultipleTabs,
          blockRightClick: examData.blockRightClick,
          blockSearchEngines: examData.blockSearchEngines,
          browserMonitoring: examData.browserMonitoring,
          deviceTracking: examData.deviceTracking,
          fullScreenMode: examData.fullScreenMode,
          periodicUserValidation: examData.periodicUserValidation,
          resumeCount: examData.resumeCount,
          screenshotBlocking: examData.screenshotBlocking,
          webcamRequired: examData.webcamRequired,
          endTime: examData.dueDate ? new Date(examData.dueDate) : null,
        },
      })

      // Create questions for the exam
      for (const [index, questionData] of examData.questions.entries()) {
        const baseQuestionData = {
          examId: exam.id,
          type: questionData.type,
          content: questionData.content,
          points: questionData.points,
          difficulty: questionData.difficulty,
          explanation: questionData.explanation,
          timeLimit: questionData.timeLimit || 0,
          orderIndex: index,
        }

        // Convert the question data to match the schema's JSON fields
        let options: Prisma.InputJsonValue | undefined = undefined
        let testCases: Prisma.InputJsonValue | undefined = undefined

        if (questionData.type === 'MULTIPLE_CHOICE' && questionData.options) {
          options = questionData.options as Prisma.InputJsonValue
        } else if (questionData.type === 'MATCHING' && questionData.matchingPairs) {
          options = questionData.matchingPairs as Prisma.InputJsonValue
        } else if (questionData.type === 'CODING' && questionData.testCases) {
          testCases = questionData.testCases as Prisma.InputJsonValue
        }

        await tx.question.create({
          data: {
            ...baseQuestionData,
            options,
            testCases,
            correctAnswer: questionData.correctAnswer,
            rubric: questionData.rubric,
            codeTemplate: questionData.codeTemplate,
          },
        })
      }

      return exam
    })

    // If this was created from a draft, delete the draft
    if (body.fromDraft) {
      await deleteExamDraft(user.id)
    }

    return Response.json({
      success: true,
      message: 'Exam created successfully',
      data: exam
    })
  } catch (error) {
    console.error('Failed to create exam:', error)
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return Response.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classId = params.classId
    const teacherClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: user.id,
      },
    })

    if (!teacherClass) {
      return Response.json(
        { error: 'Class not found or unauthorized' },
        { status: 404 }
      )
    }

    const exams = await prisma.exam.findMany({
      where: {
        classId: classId,
      },
      include: {
        questions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the questions to include parsed JSON fields
    const transformedExams = exams.map(exam => ({
      ...exam,
      questions: exam.questions.map(question => ({
        ...question,
        options: question.options as Record<string, any> | null,
        testCases: question.testCases as Record<string, any> | null,
      })),
    }))

    return Response.json({ success: true, data: transformedExams })
  } catch (error) {
    console.error('Failed to fetch exams:', error)
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch exams',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
