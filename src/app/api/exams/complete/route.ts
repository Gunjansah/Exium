import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

interface SecurityViolation {
  description: string
  timestamp: string
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { examId, userId, answers } = body

    if (!examId || !userId || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // First get the exam to find its class
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { classId: true }
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Check if student is enrolled in the class
    const classEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_userId: {
          classId: exam.classId,
          userId: session.user.email
        }
      }
    })

    if (!classEnrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this class' },
        { status: 403 }
      )
    }

    // Create or update exam enrollment
    const enrollment = await prisma.examEnrollment.upsert({
      where: {
        examId_userId: {
          examId,
          userId: session.user.email
        }
      },
      create: {
        examId,
        userId: session.user.email,
        status: 'COMPLETED',
        endTime: new Date()
      },
      update: {
        status: 'COMPLETED',
        endTime: new Date()
      }
    })

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        examId,
        userId: session.user.email,
        answer: JSON.stringify(answers),
        submittedAt: new Date()
      }
    })

    // Create security violation records if any
    if (answers.securityReport?.violations?.length > 0) {
      await prisma.securityViolation.createMany({
        data: answers.securityReport.violations.map((violation: SecurityViolation) => ({
          examId,
          userId: session.user.email,
          type: 'OTHER',
          details: { description: violation.description },
          timestamp: new Date(violation.timestamp)
        }))
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Exam completed successfully',
      enrollment, 
      submission 
    })
  } catch (error) {
    console.error('Failed to complete exam:', error)
    
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database operation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 