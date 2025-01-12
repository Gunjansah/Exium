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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        teachingClasses: true,
      },
    })

    if (!user || user.role !== 'TEACHER') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    if (!body) {
      return new NextResponse(
        JSON.stringify({ message: 'Request body is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const validatedData = examSchema.parse(body)

    // Verify class access
    const hasAccess = user.teachingClasses.some(c => c.id === validatedData.classId)
    if (!hasAccess) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized access to class' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      let exam: Exam & {
        questions: Question[];
        class: Class;
        _count: { enrollments: number; submissions: number; questions: number };
      }

      const examData: Prisma.ExamCreateInput = {
        title: validatedData.title,
        description: validatedData.description,
        duration: validatedData.duration,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : null,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
        class: {
          connect: { id: validatedData.classId },
        },
        teacher: {
          connect: { id: user.id },
        },
        status: validatedData.id ? undefined : ExamStatus.DRAFT,
        securityLevel: validatedData.securityLevel,
        maxViolations: validatedData.maxViolations,
        fullScreenMode: validatedData.fullScreenMode,
        blockMultipleTabs: validatedData.blockMultipleTabs,
        blockKeyboardShortcuts: validatedData.blockKeyboardShortcuts,
        blockRightClick: validatedData.blockRightClick,
        blockClipboard: validatedData.blockClipboard,
        browserMonitoring: validatedData.browserMonitoring,
        blockSearchEngines: validatedData.blockSearchEngines,
        resumeCount: validatedData.resumeCount,
        webcamRequired: validatedData.webcamRequired,
        deviceTracking: validatedData.deviceTracking,
        screenshotBlocking: validatedData.screenshotBlocking,
        periodicUserValidation: validatedData.periodicUserValidation,
      }

      if (validatedData.id) {
        // Update existing exam
        await tx.question.deleteMany({
          where: { examId: validatedData.id },
        })

        exam = await tx.exam.update({
          where: { id: validatedData.id },
          data: examData,
          include: {
            questions: true,
            class: true,
            _count: {
              select: {
                enrollments: true,
                submissions: true,
                questions: true,
              },
            },
          },
        })
      } else {
        // Create new exam
        exam = await tx.exam.create({
          data: examData,
          include: {
            questions: true,
            class: true,
            _count: {
              select: {
                enrollments: true,
                submissions: true,
                questions: true,
              },
            },
          },
        })
      }

      // Create questions
      if (validatedData.questions?.length > 0) {
        const questions = await tx.question.createMany({
          data: validatedData.questions.map((q, index) => ({
            examId: exam.id,
            type: q.type,
            content: q.content,
            points: q.points,
            difficulty: q.difficulty,
            explanation: q.explanation,
            timeLimit: q.timeLimit,
            orderIndex: index,
            options: q.type === QuestionType.MULTIPLE_CHOICE ? q.options : undefined,
            correctAnswer: 'correctAnswer' in q ? q.correctAnswer : undefined,
            codeTemplate: 'codeTemplate' in q ? q.codeTemplate : undefined,
            testCases: 'testCases' in q ? q.testCases : undefined,
            rubric: 'rubric' in q ? q.rubric : undefined,
            programmingLanguage: 'programmingLanguage' in q ? q.programmingLanguage : undefined,
          })),
        })

        // Refresh exam with created questions
        exam = await tx.exam.findUniqueOrThrow({
          where: { id: exam.id },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
            class: true,
            _count: {
              select: {
                enrollments: true,
                submissions: true,
                questions: true,
              },
            },
          },
        })
      }

      // Handle calendar event
      if (validatedData.startTime) {
        const calendarEventData = {
          title: `Exam: ${validatedData.title}`,
          description: validatedData.description,
          startTime: new Date(validatedData.startTime),
          endTime: validatedData.endTime ? new Date(validatedData.endTime) : null,
          type: EventType.EXAM,
          status: EventStatus.UPCOMING,
          user: { connect: { id: user.id } },
          class: { connect: { id: validatedData.classId } },
          exam: { connect: { id: exam.id } },
        }

        if (validatedData.id) {
          // Update existing calendar event
          await tx.calendarEvent.updateMany({
            where: { examId: validatedData.id },
            data: {
              title: calendarEventData.title,
              description: calendarEventData.description,
              startTime: calendarEventData.startTime,
              endTime: calendarEventData.endTime,
              status: EventStatus.UPCOMING,
            },
          })
        } else {
          // Create new calendar event
          await tx.calendarEvent.create({
            data: calendarEventData,
          })
        }
      }

      // Create exam enrollments for all students in the class
      const classStudents = await tx.classEnrollment.findMany({
        where: {
          classId: validatedData.classId,
          role: Role.STUDENT,
        },
      })

      if (!validatedData.id) { // Only create enrollments for new exams
        await tx.examEnrollment.createMany({
          data: classStudents.map(student => ({
            examId: exam.id,
            userId: student.userId,
            status: ExamEnrollmentStatus.NOT_STARTED,
          })),
          skipDuplicates: true,
        })
      }

      return exam
    })

    return NextResponse.json({ 
      success: true,
      data: result 
    }, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in exam API:', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          errors: error.errors 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        message: 'Error processing request',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const exams = await prisma.exam.findMany({
      where: {
        createdBy: user.id,
      },
      include: {
        class: {
          select: {
            id: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // If no exams found, return empty array instead of null
    return NextResponse.json({ 
      success: true,
      data: exams || [] 
    }, {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in exam API:', error)
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        message: 'Error processing request',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
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
