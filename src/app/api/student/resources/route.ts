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

    // Get resources for enrolled classes
    const resources = await prisma.resource.findMany({
      where: {
        classId: {
          in: classIds,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        url: true,
        fileSize: true,
        uploadedAt: true,
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    // Categorize resources
    const documents = resources.filter(r => r.type === 'DOCUMENT')
    const videos = resources.filter(r => r.type === 'VIDEO')
    const links = resources.filter(r => r.type === 'LINK')
    const books = resources.filter(r => r.type === 'BOOK')

    return NextResponse.json({
      documents,
      videos,
      links,
      books,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 