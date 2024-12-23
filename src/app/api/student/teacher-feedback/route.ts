import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get recent teacher feedback for the student
    const feedback = await prisma.teacherFeedback.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
          }
        },
        class: {
          select: {
            name: true,
          }
        },
        exam: {
          select: {
            title: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Limit to 5 most recent feedback items
    })

    // Format the feedback data
    const formattedFeedback = feedback.map(item => ({
      id: item.id,
      message: item.message,
      type: item.type,
      createdAt: item.createdAt.toISOString(),
      teacher: {
        name: `${item.teacher.firstName || ''} ${item.teacher.lastName || ''}`.trim() || 'Teacher',
        profileImage: item.teacher.profileImage
      },
      class: item.class.name,
      exam: item.exam?.title || null,
      context: item.exam 
        ? `Exam: ${item.exam.title}`
        : `Class: ${item.class.name}`
    }))

    return NextResponse.json(formattedFeedback)

  } catch (error) {
    console.error('Error fetching teacher feedback:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 