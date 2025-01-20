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

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // First get all classes the student is enrolled in
    const enrolledClasses = await prisma.classEnrollment.findMany({
      where: {
        userId: session.user.id,
        role: 'STUDENT',
      },
      select: {
        classId: true,
      },
    })

    const classIds = enrolledClasses.map(ec => ec.classId)

    // Get all exams from enrolled classes
    const exams = await prisma.exam.findMany({
      where: {
        classId: {
          in: classIds,
        },
        status: {
          in: ['PUBLISHED', 'ACTIVE', 'COMPLETED'],
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        duration: true,
        status: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        enrollments: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })


    // Categorize exams
    const now = new Date()
    const upcoming_exams: any[] = []
    const active_exams: any[] = []
    const completed_exams: any[] = []

    exams.forEach(exam => {
      const enrollment = exam.enrollments[0]
      const examData = {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        startTime: exam.startTime?.toISOString(),
        endTime: exam.endTime?.toISOString(),
        duration: exam.duration,
        status: exam.status,
        className: exam.class.name,
        classId: exam.class.id,
        enrollment: enrollment ? {
          id: enrollment.id,
          status: enrollment.status,
          startTime: enrollment.startTime?.toISOString(),
          endTime: enrollment.endTime?.toISOString(),
        } : null,
      }

      // If student is already enrolled
      // if (enrollment) {
      //   if (enrollment.status === 'IN_PROGRESS') {
      //     active_exams.push(examData)
      //   } else if (enrollment.status === 'COMPLETED' || enrollment.status === 'SUBMITTED') {
      //     completed_exams.push(examData)
      //   } else if (enrollment.status === 'NOT_STARTED' && exam.startTime && exam.startTime > now) {
      //     upcoming_exams.push(examData)
      //   }
      // } 

      // If not enrolled but exam is published/active
     if (exam.status === 'PUBLISHED' || exam.status === 'ACTIVE') {
        if (exam.startTime && exam.startTime > now) {
          upcoming_exams.push(examData)
        } else if ((!exam.startTime || exam.startTime <= now) && (!exam.endTime || exam.endTime > now)) {
          active_exams.push(examData)
        }
        else {
          completed_exams.push(examData)
        }
      }
    })

    return NextResponse.json({
      upcoming: upcoming_exams,
      active: active_exams,
      completed: completed_exams,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 