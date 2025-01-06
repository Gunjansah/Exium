import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { ExamResponse, UpdateExamRequest } from '@/types/exam'
import { z } from 'zod'
import { ExamStatus, SecurityLevel } from '@prisma/client'

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

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error('Failed to fetch exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exam' },
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

    return NextResponse.json({ success: true, data: exam })
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

    return NextResponse.json({ success: true, data: existingExam })
  } catch (error) {
    console.error('Failed to delete exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete exam' },
      { status: 500 }
    )
  }
}
