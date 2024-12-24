import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

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
        // Include both PUBLISHED and ACTIVE exams
        status: {
          in: ['PUBLISHED', 'ACTIVE']
        },
        OR: [
          {
            // Exams with a specific start time in the future
            startTime: {
              gte: new Date()
            }
          },
          {
            // Exams without a specific start time (flexible timing)
            startTime: null
          }
        ]
      },
      include: {
        class: {
          select: {
            name: true,
            code: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        enrollments: {
          where: {
            userId: session.user.id
          },
          select: {
            isLocked: true,
            violationCount: true
          }
        }
      },
      orderBy: [
        {
          startTime: 'asc'
        },
        {
          createdAt: 'desc'
        }
      ]
    })

    console.log('Upcoming exams found:', upcomingExams.length, 
      upcomingExams.map(exam => ({
        examId: exam.id,
        title: exam.title,
        className: exam.class.name,
        classCode: exam.class.code,
        status: exam.status,
        startTime: exam.startTime,
        teacher: `${exam.class.teacher.firstName} ${exam.class.teacher.lastName}`.trim()
      }))
    )

    // Format the exams data
    const formattedExams = upcomingExams.map(exam => {
      const enrollment = exam.enrollments[0]
      const now = new Date()
      const startTime = exam.startTime ? new Date(exam.startTime) : null
      const endTime = exam.endTime ? new Date(exam.endTime) : null
      
      // Determine if the exam can be started
      let canStart = false
      if (exam.status === 'ACTIVE') {
        if (startTime && endTime) {
          // Timed exam with specific window
          canStart = now >= startTime && now <= endTime
        } else if (startTime) {
          // Exam with only start time
          canStart = now >= startTime
        } else {
          // Flexible timing exam
          canStart = true
        }
      }

      // Check if the student is locked out
      if (enrollment?.isLocked) {
        canStart = false
      }

      return {
        id: exam.id,
        title: exam.title,
        className: exam.class.name,
        classCode: exam.class.code,
        teacher: `${exam.class.teacher.firstName} ${exam.class.teacher.lastName}`.trim(),
        date: exam.startTime?.toISOString(),
        endTime: exam.endTime?.toISOString(),
        duration: exam.duration,
        status: exam.status,
        canStart,
        isLocked: enrollment?.isLocked || false,
        violationCount: enrollment?.violationCount || 0,
        securityLevel: exam.securityLevel
      }
    })

    return NextResponse.json(formattedExams)

  } catch (error) {
    console.error('Error fetching upcoming exams:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}