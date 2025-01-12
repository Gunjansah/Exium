import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const handleEnrollmentSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  action: z.enum(['APPROVED', 'REJECTED']),
})

export async function POST(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify the class belongs to this teacher
    const targetClass = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!targetClass) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Class not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { requestId, action } = handleEnrollmentSchema.parse(body)

    // Get the enrollment request
    const enrollmentRequest = await prisma.enrollmentRequest.findFirst({
      where: {
        id: requestId,
        classId: params.classId,
        status: 'PENDING',
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

    if (!enrollmentRequest) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Enrollment request not found or already processed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle the enrollment request based on the action
    if (action === 'APPROVED') {
      // Create the enrollment and update the request status in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the enrollment
        const enrollment = await tx.classEnrollment.create({
          data: {
            class: { connect: { id: params.classId } },
            user: { connect: { id: enrollmentRequest.user.id } },
          },
        })

        // Update the request status
        const updatedRequest = await tx.enrollmentRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
        })

        return { enrollment, updatedRequest }
      })

      return NextResponse.json({
        success: true,
        message: 'Enrollment request approved successfully',
        data: result
      })
    } else {
      // Just update the request status to rejected
      const result = await prisma.enrollmentRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({
        success: true,
        message: 'Enrollment request rejected successfully',
        data: result
      })
    }
  } catch (error) {
    console.error('Error handling enrollment request:', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          errors: error.errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Error processing request',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Get pending enrollment requests for a class
export async function GET(
  req: Request,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify the class belongs to this teacher
    const targetClass = await prisma.class.findFirst({
      where: {
        id: params.classId,
        teacherId: user.id,
      },
    })

    if (!targetClass) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Class not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get all pending enrollment requests for this class
    const enrollmentRequests = await prisma.enrollmentRequest.findMany({
      where: {
        classId: params.classId,
        status: 'PENDING',
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
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: enrollmentRequests
    })
  } catch (error) {
    console.error('Error fetching enrollment requests:', error)
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Error processing request',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 