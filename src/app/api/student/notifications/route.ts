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

    // Get student's notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
        read: true,
        link: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format the response
    return NextResponse.json(
      notifications.map(notification => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      })),
      {
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { title, message, type, link, metadata } = await request.json()

    // Create a new notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        link,
        metadata,
        userId: session.user.id,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 