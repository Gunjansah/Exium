import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { ClassResponse, UpdateClassRequest } from '@/types/class'
import { z } from 'zod'

const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

// GET /api/teacher/classes/[classId] - Get class details
export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
): Promise<NextResponse<ClassResponse>> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const classData = await prisma.class.findUnique({
      where: {
        id: params.classId,
        teacherId: session.user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        exams: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            startTime: true,
            endTime: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format
    const formattedClass = {
      id: classData.id,
      name: classData.name,
      code: classData.code,
      description: classData.description,
      teacherId: classData.teacherId,
      createdAt: classData.createdAt,
      updatedAt: classData.updatedAt,
      teacher: classData.teacher,
      _count: classData._count,
      students: classData.enrollments.map((enrollment) => enrollment.user),
      exams: classData.exams,
    }

    return NextResponse.json({ success: true, data: formattedClass })
  } catch (error) {
    console.error('Failed to fetch class:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class' },
      { status: 500 }
    )
  }
}

// PATCH /api/teacher/classes/[classId] - Update class details
export async function PATCH(
  request: Request,
  { params }: { params: { classId: string } }
): Promise<NextResponse<ClassResponse>> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify class ownership
    const existingClass = await prisma.class.findUnique({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    const json = await request.json()
    const validatedData = updateClassSchema.parse(json)

    const updatedClass = await prisma.class.update({
      where: {
        id: params.classId,
      },
      data: validatedData,
      include: {
        _count: {
          select: {
            enrollments: true,
            exams: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: updatedClass })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Failed to update class:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update class' },
      { status: 500 }
    )
  }
}

// DELETE /api/teacher/classes/[classId] - Delete a class
export async function DELETE(
  request: Request,
  { params }: { params: { classId: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify class ownership and delete
    await prisma.class.delete({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Class deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to delete class:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete class' },
      { status: 500 }
    )
  }
}
