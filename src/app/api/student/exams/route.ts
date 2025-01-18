import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const now = new Date()
    const enrolledExams = await prisma.examEnrollment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exam: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Categorize exams
    const categorizedExams = enrolledExams.reduce(
      (acc, enrollment) => {
        const exam = enrollment.exam
        const startTime = exam.startTime ? new Date(exam.startTime) : null
        const endTime = exam.endTime ? new Date(exam.endTime) : null

        const examData = {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          startTime: exam.startTime,
          endTime: exam.endTime,
          duration: exam.duration,
          status: exam.status,
          className: exam.class.name,
          classId: exam.class.id,
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            startTime: enrollment.startTime,
            endTime: enrollment.endTime,
          },
        }

        // Categorize based on dates and status
        if (enrollment.status === 'COMPLETED' || enrollment.status === 'SUBMITTED' || 
            (endTime && endTime < now)) {
          acc.completed.push(examData)
        } else if (!startTime || startTime > now) {
          acc.upcoming.push(examData)
        } else if ((!endTime || endTime > now) && exam.status === 'PUBLISHED') {
          acc.active.push(examData)
        }

        return acc
      },
      { active: [], upcoming: [], completed: [] } as {
        active: any[]
        upcoming: any[]
        completed: any[]
      }
    )

    // Sort each category
    categorizedExams.active.sort((a, b) => 
      new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime()
    )
    categorizedExams.upcoming.sort((a, b) => 
      new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime()
    )
    categorizedExams.completed.sort((a, b) => 
      new Date(b.endTime || 0).getTime() - new Date(a.endTime || 0).getTime()
    )

    return NextResponse.json(categorizedExams)
  } catch (error) {
    console.error('Error fetching exams:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 