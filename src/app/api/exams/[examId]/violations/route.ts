import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { SecurityViolation } from '@/types/exam'
import { z } from 'zod'
import { ViolationType } from '@prisma/client'

const violationSchema = z.object({
  examId: z.string(),
  type: z.nativeEnum(ViolationType),
  details: z.any().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const json = await request.json()
    const validatedData = violationSchema.parse({
      ...json,
      examId: params.examId,
    })

    // Check if the exam exists and user is enrolled
    const enrollment = await prisma.examEnrollment.findFirst({
      where: {
        examId: params.examId,
        userId: user.id,
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in exam' },
        { status: 403 }
      )
    }

    // Create the violation record
    const violation = await prisma.securityViolation.create({
      data: {
        examId: params.examId,
        userId: user.id,
        type: validatedData.type,
        details: validatedData.details,
      },
    })

    // Update violation count in enrollment
    const updatedEnrollment = await prisma.examEnrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        violationCount: {
          increment: 1,
        },
      },
    })

    // Get the exam to check maxViolations
    const exam = await prisma.exam.findUnique({
      where: {
        id: params.examId,
      },
    })

    // Lock the exam if violation count exceeds max violations
    if (exam && updatedEnrollment.violationCount >= exam.maxViolations) {
      await prisma.examEnrollment.update({
        where: {
          id: enrollment.id,
        },
        data: {
          isLocked: true,
        },
      })
    }

    return NextResponse.json({ success: true, data: violation })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Failed to record violation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record violation' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // For teachers, return all violations for the exam
    // For students, return only their own violations
    const violations = await prisma.securityViolation.findMany({
      where: {
        examId: params.examId,
        ...(user.role === 'STUDENT' ? { userId: user.id } : {}),
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: violations })
  } catch (error) {
    console.error('Failed to fetch violations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch violations' },
      { status: 500 }
    )
  }
}
