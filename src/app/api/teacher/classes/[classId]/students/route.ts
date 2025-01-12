import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addStudentSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// GET /api/teacher/classes/[classId]/students - Get all students in a class
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

    // Get all enrolled students
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId: params.classId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    const students = enrollments.map(enrollment => ({
      id: enrollment.user.id,
      email: enrollment.user.email,
      firstName: enrollment.user.firstName,
      lastName: enrollment.user.lastName,
      enrolledAt: enrollment.enrolledAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: students
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/teacher/classes/[classId]/students - Add a student to the class
export async function POST(
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

    const body = await req.json()
    const { email } = addStudentSchema.parse(body)

    // Find the student
    const student = await prisma.user.findUnique({
      where: { email },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, message: 'User is not a student' },
        { status: 400 }
      )
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.classEnrollment.findFirst({
      where: {
        classId: params.classId,
        userId: student.id,
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, message: 'Student is already enrolled in this class' },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: params.classId,
        userId: student.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: enrollment.user.id,
        email: enrollment.user.email,
        firstName: enrollment.user.firstName,
        lastName: enrollment.user.lastName,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 