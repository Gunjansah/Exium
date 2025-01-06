import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { SecurityLevel } from '@prisma/client'

const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  startTime: z.date().nullable().optional(),
  endTime: z.date().nullable().optional(),
  classId: z.string().min(1, 'Class ID is required'),
  questions: z.array(z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'MATCHING', 'CODING']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    points: z.number().min(1),
    content: z.string().min(1, 'Question content is required'),
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    options: z.array(z.string()).optional(),
    codeTemplate: z.string().optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
      isHidden: z.boolean(),
    })).optional(),
  })).optional(),
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
  resumeCount: z.number().min(0).optional(),
  webcamRequired: z.boolean().optional(),
  deviceTracking: z.boolean().optional(),
  screenshotBlocking: z.boolean().optional(),
  periodicUserValidation: z.boolean().optional(),
})

// POST /api/teacher/exams - Create a new exam
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Request body is required' },
        { status: 400 }
      )
    }

    console.log('Received request body:', body)

    let validatedData
    try {
      validatedData = createExamSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors)
        return NextResponse.json(
          { success: false, error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // Check if the teacher has access to the class
    const classExists = await prisma.class.findFirst({
      where: {
        id: validatedData.classId,
        teacherId: session.user.id,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: 'Class not found or unauthorized' },
        { status: 404 }
      )
    }

    // Create the exam
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        duration: validatedData.duration,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        classId: validatedData.classId,
        createdBy: session.user.id,
        status: 'DRAFT',
        // Security Settings
        securityLevel: validatedData.securityLevel ?? SecurityLevel.MINIMAL,
        maxViolations: validatedData.maxViolations ?? 3,
        // Security Features
        fullScreenMode: validatedData.fullScreenMode ?? false,
        blockMultipleTabs: validatedData.blockMultipleTabs ?? false,
        blockKeyboardShortcuts: validatedData.blockKeyboardShortcuts ?? false,
        blockRightClick: validatedData.blockRightClick ?? false,
        blockClipboard: validatedData.blockClipboard ?? false,
        browserMonitoring: validatedData.browserMonitoring ?? false,
        blockSearchEngines: validatedData.blockSearchEngines ?? false,
        resumeCount: validatedData.resumeCount ?? 0,
        webcamRequired: validatedData.webcamRequired ?? false,
        deviceTracking: validatedData.deviceTracking ?? false,
        screenshotBlocking: validatedData.screenshotBlocking ?? false,
        periodicUserValidation: validatedData.periodicUserValidation ?? false,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (validatedData.questions && validatedData.questions.length > 0) {
      await prisma.question.createMany({
        data: validatedData.questions.map((question, index) => ({
          ...question,
          examId: exam.id,
          orderIndex: index,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...exam,
        questions: validatedData.questions || [],
      },
    })
  } catch (error) {
    console.error('Failed to create exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}

// GET /api/teacher/exams - Get all exams for the teacher
export async function GET() {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: exams })
  } catch (error) {
    console.error('Failed to fetch exams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}
