import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { 
  QuestionType, 
  DifficultyLevel, 
  SecurityLevel, 
  ExamStatus, 
  Exam,
  Question,
  Class,
  EventType,
  EventStatus,
  Role,
  ExamEnrollmentStatus,
  Prisma 
} from '@prisma/client'
import { examFormSchema } from '@/lib/validations/exam'

const questionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(QuestionType.MULTIPLE_CHOICE),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })).min(2),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.SHORT_ANSWER),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    correctAnswer: z.string().min(1),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.LONG_ANSWER),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    correctAnswer: z.string().optional(),
    rubric: z.string().optional(),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.TRUE_FALSE),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    correctAnswer: z.enum(['true', 'false']),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.MATCHING),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    matchingPairs: z.array(z.object({
      left: z.string().min(1),
      right: z.string().min(1),
    })).min(2),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.CODING),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    codeTemplate: z.string().optional(),
    programmingLanguage: z.string().min(1),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string().min(1),
      isHidden: z.boolean(),
      explanation: z.string().optional(),
    })).min(1),
    orderIndex: z.number(),
  }),
])

const examSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().nullable(),
  duration: z.number().min(1),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  classId: z.string(),
  questions: z.array(questionSchema),
  securityLevel: z.nativeEnum(SecurityLevel),
  maxViolations: z.number().min(1),
  fullScreenMode: z.boolean(),
  blockMultipleTabs: z.boolean(),
  blockKeyboardShortcuts: z.boolean(),
  blockRightClick: z.boolean(),
  blockClipboard: z.boolean(),
  browserMonitoring: z.boolean(),
  blockSearchEngines: z.boolean(),
  resumeCount: z.number().min(0),
  webcamRequired: z.boolean(),
  deviceTracking: z.boolean(),
  screenshotBlocking: z.boolean(),
  periodicUserValidation: z.boolean(),
})

export async function POST(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authConfig)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request data
    const body = await request.json()

    // Validate data
    const validatedData = examFormSchema.parse(body)

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title.trim(),
        description: validatedData.description?.trim() || null,
        duration: validatedData.duration,
        classId: validatedData.classId,
        createdBy: session.user.id,
        startTime: validatedData.startTime || null,
        endTime: validatedData.endTime || null,
        status: 'DRAFT',
        securityLevel: SecurityLevel.STANDARD,
        questions: {
          create: validatedData.questions.map((q, index) => ({
            content: q.content,
            type: q.type,
            points: q.points,
            difficulty: q.difficulty,
            orderIndex: index,
            timeLimit: q.timeLimit || null,
            explanation: q.explanation || null,
            options: q.type === 'MULTIPLE_CHOICE' && q.options
              ? {
                  create: q.options.map((opt) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    explanation: opt.explanation || null,
                  })),
                }
              : undefined,
          })),
        },
        blockClipboard: validatedData.blockClipboard,
        blockKeyboardShortcuts: validatedData.blockKeyboardShortcuts,
        blockMultipleTabs: validatedData.blockMultipleTabs,
        blockRightClick: validatedData.blockRightClick,
        blockSearchEngines: validatedData.blockSearchEngines,
        browserMonitoring: validatedData.browserMonitoring,
        deviceTracking: validatedData.deviceTracking,
        fullScreenMode: validatedData.fullScreenMode,
        maxViolations: validatedData.maxViolations,
        periodicUserValidation: validatedData.periodicUserValidation,
        resumeCount: validatedData.resumeCount,
        screenshotBlocking: validatedData.screenshotBlocking,
        webcamRequired: validatedData.webcamRequired,
      },
    })

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Failed to create exam:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create exam' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get all exams created by the teacher, including class information
    const exams = await prisma.exam.findMany({
      where: {
        createdBy: session.user.id,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        questions: {
          select: {
            id: true,
            type: true,
            points: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(exams)
  } catch (error) {
    console.error('Failed to fetch exams:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { examId } = await request.json()
    if (!examId) {
      return new NextResponse('Exam ID is required', { status: 400 })
    }

    // Verify the exam belongs to the teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        createdBy: session.user.id,
      },
    })

    if (!exam) {
      return new NextResponse('Exam not found or unauthorized', { status: 404 })
    }

    // Delete the exam and all related data
    await prisma.exam.delete({
      where: {
        id: examId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete exam:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const validatedData = examSchema.parse(body)

    if (!validatedData.id) {
      return new NextResponse('Exam ID is required', { status: 400 })
    }

    // Reuse the POST logic for updates
    const response = await POST(new Request(req.url, {
      method: 'POST',
      body: JSON.stringify(validatedData),
    }))

    return response
  } catch (error) {
    console.error('Error in exam API:', error)
    return new NextResponse(
      'Error processing request',
      { status: 500 }
    )
  }
}
