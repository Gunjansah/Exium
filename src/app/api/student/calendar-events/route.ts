import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    console.log('Calendar events GET request received')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('User ID:', session.user.id)

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    console.log('Query params:', { startDate, endDate })

    if (!startDate || !endDate) {
      console.log('Missing start or end date')
      return new NextResponse(
        JSON.stringify({ error: 'Start and end dates are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get calendar events
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        class: {
          select: {
            name: true,
            code: true
          }
        },
        exam: {
          select: {
            title: true,
            duration: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    console.log('Found calendar events:', events)

    // Get exams that don't have calendar events yet
    const exams = await prisma.exam.findMany({
      where: {
        class: {
          enrollments: {
            some: {
              userId: session.user.id,
              role: 'STUDENT'
            }
          }
        },
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        NOT: {
          calendarEvents: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        class: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    console.log('Found exams without events:', exams)

    // Create calendar events for exams automatically
    const examEvents = await Promise.all(
      exams.map(async (exam) => {
        const event = await prisma.calendarEvent.create({
          data: {
            title: exam.title,
            description: `Exam for ${exam.class.name}`,
            startTime: exam.startTime!,
            endTime: exam.endTime,
            type: 'EXAM',
            userId: session.user.id,
            classId: exam.classId,
            examId: exam.id
          },
          include: {
            class: {
              select: {
                name: true,
                code: true
              }
            },
            exam: {
              select: {
                title: true,
                duration: true
              }
            }
          }
        })
        return event
      })
    )

    console.log('Created exam events:', examEvents)

    // Combine all events
    const allEvents = [...events, ...examEvents]

    // Format the events for the calendar
    const formattedEvents = allEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.startTime.toISOString(),
      end: event.endTime?.toISOString() || undefined,
      type: event.type,
      status: event.status,
      className: getEventClassName(event.type, event.status),
      extendedProps: {
        class: event.class?.name,
        classCode: event.class?.code,
        examDuration: event.exam?.duration,
        type: event.type
      }
    }))

    console.log('Formatted events:', formattedEvents)

    return NextResponse.json(formattedEvents)

  } catch (error) {
    console.error('Error in calendar events API:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function getEventClassName(type: string, status: string): string {
  const baseClass = 'rounded-md px-2 py-1 text-xs font-medium'
  
  switch (type) {
    case 'EXAM':
      return `${baseClass} bg-red-100 text-red-800 border border-red-200`
    case 'DEADLINE':
      return `${baseClass} bg-yellow-100 text-yellow-800 border border-yellow-200`
    case 'ASSIGNMENT':
      return `${baseClass} bg-blue-100 text-blue-800 border border-blue-200`
    case 'MEETING':
      return `${baseClass} bg-purple-100 text-purple-800 border border-purple-200`
    case 'REMINDER':
      return `${baseClass} bg-green-100 text-green-800 border border-green-200`
    default:
      return `${baseClass} bg-gray-100 text-gray-800 border border-gray-200`
  }
}

// POST endpoint to create new events
export async function POST(request: Request) {
  try {
    console.log('Calendar events POST request received')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { title, description, startTime, endTime, type, classId, examId } = body

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        type,
        userId: session.user.id,
        classId,
        examId
      }
    })

    console.log('Created event:', event)
    return NextResponse.json(event)

  } catch (error) {
    console.error('Error creating calendar event:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 