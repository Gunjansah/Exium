import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { ClassMembersResponse } from '@/types/class'
import { z } from 'zod'

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
})

// GET /api/teacher/classes/[classId]/members - Get all members of a class
export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
): Promise<NextResponse<ClassMembersResponse>> {
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
    const classExists = await prisma.class.findUnique({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    const members = await prisma.classEnrollment.findMany({
      where: {
        classId: params.classId,
      },
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
      orderBy: {
        enrolledAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('Failed to fetch class members:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class members' },
      { status: 500 }
    )
  }
}

// POST /api/teacher/classes/[classId]/members - Add a member to the class
export async function POST(
  request: Request,
  { params }: { params: { classId: string } }
) {
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
    const classExists = await prisma.class.findUnique({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    const json = await request.json()
    const validatedData = addMemberSchema.parse(json)

    // Find or create user
    const memberUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!memberUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_userId: {
          classId: params.classId,
          userId: memberUser.id,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'User is already enrolled in this class' },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: params.classId,
        userId: memberUser.id,
        role: validatedData.role,
      },
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
    })

    return NextResponse.json(
      { success: true, data: enrollment },
      { status: 201 }
    )
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

    console.error('Failed to add class member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add class member' },
      { status: 500 }
    )
  }
}

// DELETE /api/teacher/classes/[classId]/members/[memberId] - Remove a member from the class
export async function DELETE(
  request: Request,
  { params }: { params: { classId: string; memberId: string } }
) {
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
    const classExists = await prisma.class.findUnique({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    // Delete enrollment
    await prisma.classEnrollment.delete({
      where: {
        classId_userId: {
          classId: params.classId,
          userId: params.memberId,
        },
      },
    })

    return NextResponse.json(
      { success: true, message: 'Member removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to remove class member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove class member' },
      { status: 500 }
    )
  }
}
