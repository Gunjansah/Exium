import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { z } from 'zod'

// Validation schema for new events
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['EXAM', 'DEADLINE', 'ASSIGNMENT', 'MEETING', 'REMINDER', 'OTHER']),
  startTime: z.string().transform(str => new Date(str)),
  endTime: z.string().optional().transform(str => str ? new Date(str) : undefined),
  classId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const json = await request.json()
    const validatedData = createEventSchema.parse(json)

    // Create the calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        userId: session.user.id,
        classId: validatedData.classId,
        status: 'UPCOMING',
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    console.error('Error creating calendar event:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const monthParam = url.searchParams.get('month')
    const yearParam = url.searchParams.get('year')
    const dayParam = url.searchParams.get('day')

    // Validate date parameters
    if (!monthParam || !yearParam) {
      return new NextResponse('Missing required date parameters', { status: 400 })
    }

    const month = parseInt(monthParam)
    const year = parseInt(yearParam)
    const day = dayParam ? parseInt(dayParam) : undefined

    // Validate parsed values
    if (isNaN(month) || isNaN(year) || (day !== undefined && isNaN(day))) {
      return new NextResponse('Invalid date parameters', { status: 400 })
    }

    let startDate: Date
    let endDate: Date

    try {
      if (day) {
        const date = new Date(year, month - 1, day)
        startDate = startOfDay(date)
        endDate = endOfDay(date)
      } else {
        const date = new Date(year, month - 1)
        startDate = startOfMonth(date)
        endDate = endOfMonth(date)
      }
    } catch (error) {
      return new NextResponse('Invalid date parameters', { status: 400 })
    }

    // Get student's enrolled classes
    const enrolledClasses = await prisma.classEnrollment.findMany({
      where: {
        userId: session.user.id,
        role: 'STUDENT',
      },
      select: {
        classId: true,
      },
    })

    const classIds = enrolledClasses.map(ec => ec.classId)

    // Get all calendar events for the student
    const [events, examEnrollments] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          OR: [
            // Events directly assigned to the student
            { userId: session.user.id },
            // Events from classes the student is enrolled in
            { classId: { in: classIds } },
          ],
          AND: [
            {
              startTime: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
        include: {
          exam: {
            select: {
              title: true,
              description: true,
              duration: true,
            },
          },
          class: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      }),
      // Get exam enrollments for additional exam details
      prisma.examEnrollment.findMany({
        where: {
          userId: session.user.id,
          exam: {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              description: true,
              startTime: true,
              endTime: true,
              duration: true,
              status: true,
            },
          },
        },
      }),
    ])

    // Format the response
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      status: event.status,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime?.toISOString(),
      className: event.class?.name,
      examDetails: event.exam ? {
        title: event.exam.title,
        description: event.exam.description,
        duration: event.exam.duration,
      } : null,
    }))

    // Add exam enrollments that don't have calendar events yet
    const examEvents = examEnrollments
      .filter(enrollment => !events.some(event => event.examId === enrollment.examId))
      .map(enrollment => ({
        id: `exam-${enrollment.examId}`,
        title: enrollment.exam.title,
        description: enrollment.exam.description,
        type: 'EXAM' as const,
        status: enrollment.status,
        startTime: enrollment.exam.startTime?.toISOString(),
        endTime: enrollment.exam.endTime?.toISOString(),
        examDetails: {
          title: enrollment.exam.title,
          description: enrollment.exam.description,
          duration: enrollment.exam.duration,
        },
      }))

    return NextResponse.json({
      events: [...formattedEvents, ...examEvents].sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0
        return aTime - bTime
      }),
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 