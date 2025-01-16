import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ViolationType } from '@prisma/client'

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
    const { type } = await request.json() as { type: ViolationType }

    // Verify exam enrollment
    const enrollment = await prisma.examEnrollment.findFirst({
      where: {
        examId,
        userId,
        status: 'IN_PROGRESS',
      },
      include: {
        exam: true,
      },
    })

    if (!enrollment) {
      return new NextResponse('No active exam session found', { status: 404 })
    }

    // Record the violation
    const violation = await prisma.securityViolation.create({
      data: {
        examId,
        userId,
        type,
        details: {
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
        },
      },
    })

    // Update violation count in enrollment
    const updatedEnrollment = await prisma.examEnrollment.update({
      where: { id: enrollment.id },
      data: {
        violationCount: {
          increment: 1,
        },
      },
    })

    // Create proctoring log
    await prisma.proctoringLog.create({
      data: {
        examId,
        userId,
        eventType: 'SECURITY_VIOLATION',
        meta: {
          violationType: type,
          timestamp: new Date().toISOString(),
          violationCount: updatedEnrollment.violationCount,
        },
      },
    })

    // Check if max violations exceeded
    if (updatedEnrollment.violationCount >= enrollment.exam.maxViolations) {
      // Lock the exam session
      await prisma.examEnrollment.update({
        where: { id: enrollment.id },
        data: {
          isLocked: true,
          status: 'COMPLETED',
          endTime: new Date(),
        },
      })

      return new NextResponse(
        JSON.stringify({
          violation,
          status: 'TERMINATED',
          message: 'Maximum violations exceeded. Exam terminated.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({
        violation,
        status: 'RECORDED',
        violationCount: updatedEnrollment.violationCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Failed to record violation:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 