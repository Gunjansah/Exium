import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const includeClass = searchParams.get('include') === 'class'

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: new Date(start),
          lte: new Date(end)
        }
      },
      include: {
        class: includeClass,
        exam: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { title, description, startTime, endTime, type, status, classId, examId } = data

    if (!title || !startTime || !type) {
      return NextResponse.json(
        { error: 'Title, start time, and type are required' },
        { status: 400 }
      )
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        type,
        status: status || 'UPCOMING',
        userId: session.user.id,
        classId,
        examId
      },
      include: {
        class: true,
        exam: true
      }
    })

    // Publish event to all connected clients for real-time updates
    // You can implement WebSocket or Server-Sent Events here

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Verify the event belongs to the user
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.calendarEvent.delete({
      where: { id }
    })

    // Publish deletion to all connected clients for real-time updates
    // You can implement WebSocket or Server-Sent Events here

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const data = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Verify the event belongs to the user
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : null,
        type: data.type,
        status: data.status,
        classId: data.classId,
        examId: data.examId
      },
      include: {
        class: true,
        exam: true
      }
    })

    // Publish update to all connected clients for real-time updates
    // You can implement WebSocket or Server-Sent Events here

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}