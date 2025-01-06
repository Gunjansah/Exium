import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export async function GET() {
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

    // Get teacher's classes with counts
    const classes = await prisma.class.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
      },
    })

    // Get total students across all classes
    const totalStudents = classes.reduce(
      (acc, cls) => acc + cls._count.enrollments,
      0
    )

    // Get active and upcoming exams
    const now = new Date()
    const activeExams = await prisma.exam.count({
      where: {
        createdBy: user.id,
        status: 'ACTIVE',
      },
    })

    const upcomingExams = await prisma.exam.count({
      where: {
        createdBy: user.id,
        status: 'PUBLISHED',
        startTime: {
          gt: now,
        },
      },
    })

    // Get recent activity
    const recentActivity = await Promise.all([
      // Recent exams created
      prisma.exam
        .findMany({
          where: {
            createdBy: user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        })
        .then((exams) =>
          exams.map((exam) => ({
            id: exam.id,
            type: 'exam_created' as const,
            message: `Created exam "${exam.title}"`,
            timestamp: exam.createdAt.toISOString(),
          }))
        ),

      // Recent exam completions
      prisma.submission
        .findMany({
          where: {
            exam: {
              createdBy: user.id,
            },
          },
          orderBy: {
            submittedAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            submittedAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            exam: {
              select: {
                title: true,
              },
            },
          },
        })
        .then((submissions) =>
          submissions.map((sub) => ({
            id: sub.id,
            type: 'exam_completed' as const,
            message: `${sub.user.firstName} ${sub.user.lastName} completed "${sub.exam.title}"`,
            timestamp: sub.submittedAt.toISOString(),
          }))
        ),

      // Recent student enrollments
      prisma.classEnrollment
        .findMany({
          where: {
            class: {
              teacherId: user.id,
            },
          },
          orderBy: {
            enrolledAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            enrolledAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: {
              select: {
                name: true,
              },
            },
          },
        })
        .then((enrollments) =>
          enrollments.map((enroll) => ({
            id: enroll.id,
            type: 'student_joined' as const,
            message: `${enroll.user.firstName} ${enroll.user.lastName} joined "${enroll.class.name}"`,
            timestamp: enroll.enrolledAt.toISOString(),
          }))
        ),

      // Recent feedback
      prisma.teacherFeedback
        .findMany({
          where: {
            teacherId: user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        })
        .then((feedback) =>
          feedback.map((fb) => ({
            id: fb.id,
            type: 'feedback_received' as const,
            message: `Received feedback from ${fb.user.firstName} ${fb.user.lastName}`,
            timestamp: fb.createdAt.toISOString(),
          }))
        ),
    ]).then((activities) =>
      activities
        .flat()
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 10)
    )

    // Get upcoming events for the next 7 days
    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: startOfDay(now),
          lte: endOfDay(addDays(now, 7)),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      select: {
        id: true,
        title: true,
        type: true,
        startTime: true,
        endTime: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalClasses: classes.length,
        activeExams,
        upcomingExams,
        recentActivity,
        upcomingEvents: upcomingEvents.map((event) => ({
          ...event,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime?.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
