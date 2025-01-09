import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Get the notification
    const notification = await prisma.notification.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!notification) {
      return new NextResponse('Notification not found', { status: 404 })
    }

    if (notification.userId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Mark notification as read
    const updatedNotification = await prisma.notification.update({
      where: {
        id: params.id,
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 