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

    // Get FAQs and help articles
    const [faqs, articles] = await Promise.all([
      prisma.faq.findMany({
        where: {
          OR: [
            { role: 'STUDENT' },
            { role: 'ALL' },
          ],
          published: true,
        },
        select: {
          id: true,
          question: true,
          answer: true,
          category: true,
        },
        orderBy: {
          order: 'asc',
        },
      }),
      prisma.helpArticle.findMany({
        where: {
          OR: [
            { role: 'STUDENT' },
            { role: 'ALL' },
          ],
          published: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return NextResponse.json({
      faqs,
      articles,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('Error fetching help data:', error)
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

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 