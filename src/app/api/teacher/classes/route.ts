import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { ClassListResponse, ClassResponse, CreateClassRequest } from '@/types/class'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
})

// GET /api/teacher/classes - Get all classes for the teacher
export async function GET(): Promise<NextResponse<ClassListResponse>> {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const classes = await prisma.class.findMany({
      where: {
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
        _count: {
          select: {
            enrollments: true,
            exams: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ 
      success: true, 
      data: classes.map((classItem) => ({
        ...classItem,
        _count: {
          enrollments: classItem._count.enrollments,
          exams: classItem._count.exams,
        }
      }))
    })
  } catch (error) {
    console.error('Failed to fetch classes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

// POST /api/teacher/classes - Create a new class
export async function POST(
  request: Request
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

    const json = await request.json()
    const validatedData = createClassSchema.parse(json)

    const newClass = await prisma.class.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        code: nanoid(8), // Generate a unique 8-character code
        teacherId: user.id,
      },
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

    return NextResponse.json(
      { success: true, data: newClass },
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

    console.error('Failed to create class:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create class' },
      { status: 500 }
    )
  }
}
