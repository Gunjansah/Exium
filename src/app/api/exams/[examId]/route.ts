import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { ExamResponse } from '@/types/exam'
import { ExamEnrollmentStatus } from '@prisma/client'

// GET /api/exams/[examId] - Get exam details for a student
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

    // Check if the student is enrolled in the exam
    const enrollment = await prisma.examEnrollment.findFirst({
      where: {
        examId: params.examId,
        userId: session.user.id,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            duration: true,
            status: true,
            startTime: true,
            endTime: true,
            class: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
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
                enrollments: true,
                questions: true,
                submissions: true,
              },
            },
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Exam not found or not enrolled' },
        { status: 404 }
      )
    }

    // Check if the exam is active and within the time window
    const now = new Date()
    const exam = enrollment.exam

    if (exam.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Exam is not active' },
        { status: 403 }
      )
    }

    if (exam.startTime && exam.startTime > now) {
      return NextResponse.json(
        { success: false, error: 'Exam has not started yet' },
        { status: 403 }
      )
    }

    if (exam.endTime && exam.endTime < now) {
      return NextResponse.json(
        { success: false, error: 'Exam has ended' },
        { status: 403 }
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

// POST /api/exams/[examId] - Start or submit an exam
export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (!['start', 'submit'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Check if the student is enrolled in the exam
    const enrollment = await prisma.examEnrollment.findFirst({
      where: {
        examId: params.examId,
        userId: session.user.id,
      },
      include: {
        exam: true,
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Exam not found or not enrolled' },
        { status: 404 }
      )
    }

    const now = new Date()
    const exam = enrollment.exam

    if (exam.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Exam is not active' },
        { status: 403 }
      )
    }

    if (action === 'start') {
      if (exam.startTime && exam.startTime > now) {
        return NextResponse.json(
          { success: false, error: 'Exam has not started yet' },
          { status: 403 }
        )
      }

      if (exam.endTime && exam.endTime < now) {
        return NextResponse.json(
          { success: false, error: 'Exam has ended' },
          { status: 403 }
        )
      }

      // Start the exam for the student
      await prisma.examEnrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          status: ExamEnrollmentStatus.IN_PROGRESS,
          startTime: now,
        },
      })
    } else {
      // Submit the exam
      await prisma.examEnrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          status: ExamEnrollmentStatus.SUBMITTED,
          endTime: now,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to process exam action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process exam action' },
      { status: 500 }
    )
  }
}
