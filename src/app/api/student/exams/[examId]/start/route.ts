import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ExamEnrollmentStatus } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const examId = params.examId
    const userId = session.user.id

    // Check if exam exists and is published
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        enrollments: {
          where: { userId },
        },
      },
    })

    if (!exam) {
      return new NextResponse('Exam not found', { status: 404 })
    }

    if (exam.status !== 'PUBLISHED' && exam.status !== 'ACTIVE') {
      return new NextResponse('Exam is not available', { status: 403 })
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_userId: {
          classId: exam.classId,
          userId,
        },
      },
    })

    if (!enrollment) {
      return new NextResponse('Not enrolled in this class', { status: 403 })
    }

    // Check if student has already started/completed the exam
    const examEnrollment = exam.enrollments[0]
    if (examEnrollment) {
      if (examEnrollment.status === ExamEnrollmentStatus.COMPLETED || 
          examEnrollment.status === ExamEnrollmentStatus.SUBMITTED) {
        return new NextResponse('Exam already completed', { status: 403 })
      }

      if (examEnrollment.status === ExamEnrollmentStatus.IN_PROGRESS) {
        // Check if resume is allowed
        if (examEnrollment.violationCount >= exam.maxViolations) {
          return new NextResponse('Maximum violations exceeded', { status: 403 })
        }

        if (examEnrollment.isLocked) {
          return new NextResponse('Exam session is locked', { status: 403 })
        }

        // Update the existing enrollment
        await prisma.examEnrollment.update({
          where: { id: examEnrollment.id },
          data: {
            startTime: new Date(),
            status: ExamEnrollmentStatus.IN_PROGRESS,
          },
        })
      }
    } else {
      // Create new exam enrollment
      await prisma.examEnrollment.create({
        data: {
          examId,
          userId,
          status: ExamEnrollmentStatus.IN_PROGRESS,
          startTime: new Date(),
        },
      })
    }

    // Create initial proctoring log
    await prisma.proctoringLog.create({
      data: {
        examId,
        userId,
        eventType: 'SESSION_START',
        meta: {
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      },
    })

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to start exam:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 