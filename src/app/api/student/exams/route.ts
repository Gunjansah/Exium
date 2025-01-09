import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get student's exam enrollments
    const examEnrollments = await prisma.examEnrollment.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        score: true,
        startTime: true,
        endTime: true,
        submittedAt: true,
        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            duration: true,
            totalMarks: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        exam: {
          startTime: 'asc',
        },
      },
    })

    // Categorize exams
    const now = new Date()
    const upcoming: any[] = []
    const active: any[] = []
    const completed: any[] = []

    examEnrollments.forEach(enrollment => {
      const examData = {
        id: enrollment.exam.id,
        title: enrollment.exam.title,
        description: enrollment.exam.description,
        startTime: enrollment.exam.startTime.toISOString(),
        endTime: enrollment.exam.endTime?.toISOString(),
        duration: enrollment.exam.duration,
        totalMarks: enrollment.exam.totalMarks,
        status: enrollment.status,
        score: enrollment.score,
        class: enrollment.exam.class,
        submittedAt: enrollment.submittedAt?.toISOString(),
      }

      if (enrollment.status === 'IN_PROGRESS') {
        active.push(examData)
      } else if (enrollment.status === 'COMPLETED' || enrollment.status === 'SUBMITTED') {
        completed.push(examData)
      } else if (enrollment.status === 'NOT_STARTED' && enrollment.exam.startTime > now) {
        upcoming.push(examData)
      }
    })

    return NextResponse.json({
      upcoming,
      active,
      completed,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 