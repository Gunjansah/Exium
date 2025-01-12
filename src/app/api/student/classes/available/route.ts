import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        enrolledClasses: {
          select: { classId: true }
        },
        enrollmentRequests: {
          select: { classId: true }
        }
      }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all enrolled class IDs and pending request IDs
    const enrolledClassIds = user.enrolledClasses.map(e => e.classId)
    const pendingClassIds = user.enrollmentRequests.map(r => r.classId)

    // Get all available classes that the student is not enrolled in or has pending requests for
    const availableClasses = await prisma.class.findMany({
      where: {
        AND: [
          { id: { notIn: enrolledClassIds } },
          { id: { notIn: pendingClassIds } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            exams: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: availableClasses
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 