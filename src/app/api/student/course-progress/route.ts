import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'STUDENT') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get student's enrolled classes
    const enrolledClasses = await prisma.classEnrollment.findMany({
      where: {
        userId: session.user.id,
        role: 'STUDENT'
      },
      include: {
        class: {
          include: {
            exams: {
              where: {
                OR: [
                  { status: 'COMPLETED' },
                  { status: 'ACTIVE' }
                ]
              }
            }
          }
        }
      }
    })

    // Calculate progress for each class
    const courseProgress = await Promise.all(enrolledClasses.map(async (enrollment) => {
      const totalExams = enrollment.class.exams.length
      
      // Get completed exams (submissions with scores)
      const completedExams = await prisma.submission.count({
        where: {
          userId: session.user.id,
          examId: {
            in: enrollment.class.exams.map(exam => exam.id)
          },
          score: { not: null }
        }
      })

      // Calculate progress percentage
      const progress = totalExams > 0 
        ? Math.round((completedExams / totalExams) * 100)
        : 0

      return {
        id: enrollment.class.id,
        name: enrollment.class.name,
        progress,
        icon: '📚' // You can customize this based on class type/category if needed
      }
    }))

    // Get overall statistics
    const allExams = await prisma.exam.findMany({
      where: {
        class: {
          enrollments: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    const completedSubmissions = await prisma.submission.count({
      where: {
        userId: session.user.id,
        score: { not: null }
      }
    })

    const upcomingExams = await prisma.exam.count({
      where: {
        class: {
          enrollments: {
            some: {
              userId: session.user.id
            }
          }
        },
        status: 'ACTIVE',
        endTime: {
          gt: new Date()
        }
      }
    })

    // Calculate overall progress
    const overallProgress = allExams.length > 0
      ? Math.round((completedSubmissions / allExams.length) * 100)
      : 0

    return NextResponse.json({
      courses: courseProgress,
      stats: {
        overallProgress,
        completedAssignments: completedSubmissions,
        upcomingDeadlines: upcomingExams
      }
    })

  } catch (error) {
    console.error('Error fetching course progress:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 