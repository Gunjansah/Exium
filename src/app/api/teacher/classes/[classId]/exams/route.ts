import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { QuestionType, DifficultyLevel, ExamStatus, SecurityLevel, Prisma } from '@prisma/client'

const examSchema = z.object({
  metadata: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    duration: z.number().min(0, 'Duration must be positive'),
    classId: z.string(),
  }),
  questions: z.array(z.object({
    id: z.number(),
    content: z.string().min(1, 'Question content is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER']),
    points: z.number().min(1, 'Points must be at least 1'),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
    })).optional(),
    timeLimit: z.number().min(0).optional(),
  })).min(1, 'At least one question is required'),
  securitySettings: z.object({
    blockClipboard: z.boolean(),
    blockKeyboardShortcuts: z.boolean(),
    blockMultipleTabs: z.boolean(),
    blockRightClick: z.boolean(),
    blockSearchEngines: z.boolean(),
    browserMonitoring: z.boolean(),
    deviceTracking: z.boolean(),
    fullScreenMode: z.boolean(),
    maxViolations: z.number().min(1),
    periodicUserValidation: z.boolean(),
    resumeCount: z.number().min(0),
    screenshotBlocking: z.boolean(),
    webcamRequired: z.boolean(),
  }),
})

export async function POST(
  request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    console.log('Received POST request for exam creation')
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('Unauthorized: No session user')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = examSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Check if user is teacher of the class
    const classTeacher = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: session.user.id,
      },
    })

    if (!classTeacher) {
      console.log('Unauthorized: User is not teacher of class')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Create exam with questions and security settings
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.metadata.title,
        description: validatedData.metadata.description,
        duration: validatedData.metadata.duration,
        classId: params.classId,
        createdBy: session.user.id,
        status: ExamStatus.DRAFT,
        securityLevel: SecurityLevel.STANDARD,
        blockClipboard: validatedData.securitySettings.blockClipboard,
        blockKeyboardShortcuts: validatedData.securitySettings.blockKeyboardShortcuts,
        blockMultipleTabs: validatedData.securitySettings.blockMultipleTabs,
        blockRightClick: validatedData.securitySettings.blockRightClick,
        blockSearchEngines: validatedData.securitySettings.blockSearchEngines,
        browserMonitoring: validatedData.securitySettings.browserMonitoring,
        deviceTracking: validatedData.securitySettings.deviceTracking,
        fullScreenMode: validatedData.securitySettings.fullScreenMode,
        maxViolations: validatedData.securitySettings.maxViolations,
        periodicUserValidation: validatedData.securitySettings.periodicUserValidation,
        resumeCount: validatedData.securitySettings.resumeCount,
        screenshotBlocking: validatedData.securitySettings.screenshotBlocking,
        webcamRequired: validatedData.securitySettings.webcamRequired,
        questions: {
          create: validatedData.questions.map((q, index) => {
            const questionData: Prisma.QuestionCreateWithoutExamInput = {
              content: q.content,
              type: q.type as QuestionType,
              points: q.points,
              timeLimit: q.timeLimit,
              orderIndex: index,
              difficulty: DifficultyLevel.MEDIUM,
            }

            if (q.options) {
              questionData.options = q.options as Prisma.InputJsonValue
            }

            return questionData
          }),
        },
      },
      include: {
        questions: true,
      },
    })

    console.log('Exam created successfully:', exam)
    return NextResponse.json(exam)
  } catch (error) {
    console.error('Failed to create exam:', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ 
          message: 'Invalid exam data', 
          errors: error.errors 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    return new NextResponse(
      JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const classId = await prisma.class.findUnique({
      where: {
        id: params.classId,
      },
    })
    if (!classId) {
      return new NextResponse('Class ID is required', { status: 400 })
    }

    // Check if user is teacher of the class
    const classTeacher = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: session.user.id,
      },
    })

    if (!classTeacher) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get all exams for the class
    const exams = await prisma.exam.findMany({
      where: {
        classId,
      },
      include: {
        questions: true,
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
