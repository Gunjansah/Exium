import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First, check the user's enrollment
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        userId: session.user.id,
        class: {
          code: 'CSC307'
        }
      },
      include: {
        class: true
      }
    })

    console.log('Enrollment check:', {
      userId: session.user.id,
      enrollment: enrollment ? {
        classId: enrollment.classId,
        className: enrollment.class.name,
        code: enrollment.class.code
      } : null
    })

    // Get upcoming exams for enrolled classes
    const upcomingExams = await prisma.exam.findMany({
      where: {
        class: {
          enrollments: {
            some: {
              userId: session.user.id,
              role: 'STUDENT'
            }
          }
        },
        status: 'ACTIVE',
        startTime: {
          gte: new Date() // Only future exams
        }
      },
      include: {
        class: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    console.log('Upcoming exams found:', upcomingExams.length, 
      upcomingExams.map(exam => ({
        examId: exam.id,
        title: exam.title,
        className: exam.class.name,
        classCode: exam.class.code,
        status: exam.status,
        startTime: exam.startTime
      }))
    )

    // Format the exams data
    const formattedExams = upcomingExams.map(exam => ({
      id: exam.id,
      title: exam.title,
      className: exam.class.name,
      date: exam.startTime?.toISOString(),
      endTime: exam.endTime?.toISOString(),
      duration: exam.duration,
      status: exam.status,
      // Check if the exam can be started (within the time window)
      canStart: exam.startTime 
        ? new Date() >= exam.startTime && (!exam.endTime || new Date() <= exam.endTime)
        : true
    }))

    return NextResponse.json(formattedExams)

  } catch (error) {
    console.error('Error fetching upcoming exams:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 