import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { 
  Class, 
  Exam, 
  ExamEnrollment,
  Submission,
  TeacherFeedback,
  CalendarEvent,
  ExamEnrollmentStatus,
  EventType,
} from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Fetch all data in parallel
    const [
      classEnrollments,
      examEnrollments,
      upcomingEvents,
      recentFeedback
    ] = await Promise.all([
      prisma.classEnrollment.findMany({
        where: {
          userId: session.user.id,
          role: 'STUDENT',
        },
        select: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.examEnrollment.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          status: true,
          exam: {
            select: {
              id: true,
              title: true,
            },
          },
          endTime: true,
        },
      }),
      prisma.calendarEvent.findMany({
        where: {
          userId: session.user.id,
          startTime: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
        select: {
          id: true,
          title: true,
          type: true,
          startTime: true,
          endTime: true,
        },
        orderBy: {
          startTime: 'asc',
        },
      }),
      prisma.teacherFeedback.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          message: true,
          createdAt: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ])

    // Calculate stats
    const activeExams = examEnrollments.filter(e => e.status === 'IN_PROGRESS').length
    const upcomingExamsCount = examEnrollments.filter(e => e.status === 'NOT_STARTED').length
    const completedExams = examEnrollments.filter(e => 
      e.status === 'COMPLETED' || e.status === 'SUBMITTED'
    ).length

    // Format upcoming events
    const formattedEvents = upcomingEvents.map(event => ({
      id: event.id,
      title: event.title,
      type: event.type,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime?.toISOString(),
    }))

    // Format recent activity
    const formattedActivity = [
      ...recentFeedback.map(feedback => ({
        id: feedback.id,
        type: 'feedback_received' as const,
        message: `Received feedback from ${feedback.teacher.firstName} ${feedback.teacher.lastName}: ${feedback.message}`,
        timestamp: feedback.createdAt.toISOString(),
      })),
      ...examEnrollments
        .filter(e => e.status === 'COMPLETED' || e.status === 'SUBMITTED')
        .slice(0, 5)
        .map(enrollment => ({
          id: enrollment.exam.id,
          type: 'exam_completed' as const,
          message: `Completed exam: ${enrollment.exam.title}`,
          timestamp: enrollment.endTime?.toISOString() || new Date().toISOString(),
        })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

    return NextResponse.json({
      totalClasses: classEnrollments.length,
      activeExams,
      upcomingExams: upcomingExamsCount,
      completedExams,
      recentActivity: formattedActivity,
      upcomingEvents: formattedEvents,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    })
  } catch (error) {
    console.error('Error fetching student dashboard data:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 