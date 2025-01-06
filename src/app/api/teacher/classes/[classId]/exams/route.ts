import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { ExamListResponse, ExamResponse, CreateExamRequest } from '@/types/exam'
import { z } from 'zod'
import { ExamStatus, SecurityLevel } from '@prisma/client'

const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  startTime: z.date().nullable().optional(),
  endTime: z.date().nullable().optional(),
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

// GET /api/teacher/classes/[classId]/exams - Get all exams for a class
export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
): Promise<NextResponse<ExamListResponse>> {
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

    // Check if the class exists and belongs to the teacher
    const classExists = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    const exams = await prisma.exam.findMany({
      where: {
        classId: params.classId,
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

// POST /api/teacher/classes/[classId]/exams - Create a new exam
export async function POST(
  request: Request,
  { params }: { params: { classId: string } }
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

    // Check if the class exists and belongs to the teacher
    const classExists = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    const json = await request.json()
    const validatedData = createExamSchema.parse({
      ...json,
      startTime: json.startTime ? new Date(json.startTime) : null,
      endTime: json.endTime ? new Date(json.endTime) : null,
    })

    const exam = await prisma.exam.create({
      data: {
        ...validatedData,
        createdBy: user.id,
        classId: params.classId,
        status: ExamStatus.DRAFT,
        // Set default security settings if not provided
        securityLevel: validatedData.securityLevel ?? SecurityLevel.STANDARD,
        maxViolations: validatedData.maxViolations ?? 3,
        fullScreenMode: validatedData.fullScreenMode ?? true,
        blockMultipleTabs: validatedData.blockMultipleTabs ?? true,
        blockKeyboardShortcuts: validatedData.blockKeyboardShortcuts ?? true,
        blockRightClick: validatedData.blockRightClick ?? true,
        blockClipboard: validatedData.blockClipboard ?? true,
        browserMonitoring: validatedData.browserMonitoring ?? true,
        blockSearchEngines: validatedData.blockSearchEngines ?? true,
        resumeCount: validatedData.resumeCount ?? 1,
        webcamRequired: validatedData.webcamRequired ?? false,
        deviceTracking: validatedData.deviceTracking ?? true,
        screenshotBlocking: validatedData.screenshotBlocking ?? true,
        periodicUserValidation: validatedData.periodicUserValidation ?? true,
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

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Failed to create exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}
