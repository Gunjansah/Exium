import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { classId: string } }
) {
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
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the class belongs to this teacher
    const classDetails = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: user.id,
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
      }
    })

    if (!classDetails) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: classDetails
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
