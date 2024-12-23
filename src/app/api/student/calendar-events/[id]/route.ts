import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const eventId = params.id

    // Check if the event exists and belongs to the user
    const event = await prisma.calendarEvent.findUnique({
      where: {
        id: eventId,
        userId: session.user.id
      }
    })

    if (!event) {
      return new NextResponse('Event not found', { status: 404 })
    }

    // Delete the event
    await prisma.calendarEvent.delete({
      where: {
        id: eventId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 