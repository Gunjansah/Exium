import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

// DELETE /api/teacher/classes/[classId]/students/[studentId] - Remove a student from the class
export async function DELETE(
  req: Request,
  { params }: { params: { classId: string; studentId: string } }
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
    const classExists = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { success: false, message: 'Class not found' },
        { status: 404 }
      )
    }

    // Find and delete the enrollment
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        classId: params.classId,
        userId: params.studentId,
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, message: 'Student is not enrolled in this class' },
        { status: 404 }
      )
    }

    // Delete the enrollment
    await prisma.classEnrollment.delete({
      where: {
        id: enrollment.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Student removed successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 