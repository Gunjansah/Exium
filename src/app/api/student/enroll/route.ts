import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: Request) {
  try {
    // Get the session first
    const session = await getServerSession(authOptions)
    console.log('Session data:', {
      exists: !!session,
      user: session?.user,
      expires: session?.expires
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'You must be logged in to enroll in classes'
      }, {
        status: 401
      })
    }

    // Verify user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({
        success: false,
        error: 'Only students can enroll in classes'
      }, {
        status: 403
      })
    }

    // Parse the request body
    let body
    try {
      body = await request.json()
      console.log('Request body:', body)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data'
      }, {
        status: 400
      })
    }

    const { classId, code } = body

    if (!classId || !code) {
      return NextResponse.json({
        success: false,
        error: 'Class ID and enrollment code are required'
      }, {
        status: 400
      })
    }

    // Verify the class exists and code matches
    const classToEnroll = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    console.log('Found class:', classToEnroll)

    if (!classToEnroll) {
      return NextResponse.json({
        success: false,
        error: 'Class not found'
      }, {
        status: 404
      })
    }

    if (classToEnroll.code !== code) {
      return NextResponse.json({
        success: false,
        error: 'Invalid enrollment code'
      }, {
        status: 400
      })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findFirst({
      where: {
        userId: session.user.id,
        classId: classId
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({
        success: false,
        error: 'You are already enrolled in this class'
      }, {
        status: 400
      })
    }

    // Create enrollment
    try {
      const enrollment = await prisma.classEnrollment.create({
        data: {
          userId: session.user.id,
          classId: classId,
          role: 'STUDENT'
        },
        include: {
          class: {
            select: {
              name: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })

      console.log('Created enrollment:', enrollment)

      return NextResponse.json({
        success: true,
        enrollment,
        message: `Successfully enrolled in ${enrollment.class.name}`
      })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      if (dbError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: 'You are already enrolled in this class'
        }, {
          status: 400
        })
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create enrollment'
      }, {
        status: 500
      })
    }
  } catch (error: any) {
    console.error('Enrollment error:', error)
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, {
      status: 500
    })
  }
}
