import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { subject, message } = await request.json()

    if (!subject || !message) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Create a support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        message,
        userId: session.user.id,
        status: 'OPEN',
      },
    })

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Support Ticket Created',
        message: `Your support ticket "${subject}" has been created. We'll get back to you soon.`,
        type: 'SYSTEM',
        metadata: {
          ticketId: ticket.id,
        },
      },
    })

    // Send email to support team (implementation depends on email service)
    // await sendEmail({
    //   to: 'support@example.com',
    //   subject: `New Support Ticket: ${subject}`,
    //   text: `
    //     New support ticket from ${session.user.email}
    //     Subject: ${subject}
    //     Message: ${message}
    //     Ticket ID: ${ticket.id}
    //   `,
    // })

    return NextResponse.json({
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      createdAt: ticket.createdAt,
    })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 