import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const enrollmentSchema = z.object({
  classId: z.string(),
})

export async function POST(req: Request) {
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

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { classId } = enrollmentSchema.parse(body)

    // Create enrollment request
    const enrollmentRequest = await prisma.enrollmentRequest.create({
      data: {
        user: { connect: { id: user.id } },
        class: { connect: { id: classId } },
      },
      include: {
        class: {
          select: {
            name: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Enrollment request submitted successfully',
      data: {
        requestId: enrollmentRequest.id,
        className: enrollmentRequest.class.name,
        teacherName: enrollmentRequest.class.teacher.firstName && enrollmentRequest.class.teacher.lastName
          ? `${enrollmentRequest.class.teacher.firstName} ${enrollmentRequest.class.teacher.lastName}`
          : 'Unknown Teacher'
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
      message: 'Error processing enrollment request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 