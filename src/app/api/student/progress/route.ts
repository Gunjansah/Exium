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

    // Fetch all data in parallel
    const [
      examEnrollments,
      classEnrollments,
      attendanceRecords,
      totalStudents,
    ] = await Promise.all([
      // Get exam scores
      prisma.examEnrollment.findMany({
        where: {
          userId: session.user.id,
          status: {
            in: ['COMPLETED', 'SUBMITTED'],
          },
        },
        select: {
          id: true,
          score: true,
          exam: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              startTime: true,
            },
          },
        },
        orderBy: {
          exam: {
            startTime: 'asc',
          },
        },
      }),
      // Get class enrollments with performance data
      prisma.classEnrollment.findMany({
        where: {
          userId: session.user.id,
          role: 'STUDENT',
        },
        select: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              attendanceRecords: true,
            },
          },
        },
      }),
      // Get attendance records
      prisma.attendanceRecord.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          status: true,
          classId: true,
        },
      }),
      // Get total number of students for ranking
      prisma.user.count({
        where: {
          role: 'STUDENT',
        },
      }),
    ])

    // Calculate class performance metrics
    const classPerformance = classEnrollments.map(enrollment => {
      const classAttendance = attendanceRecords.filter(
        record => record.classId === enrollment.class.id
      )
      const attendanceRate = classAttendance.length > 0
        ? (classAttendance.filter(record => record.status === 'PRESENT').length / classAttendance.length) * 100
        : 0

      return {
        classId: enrollment.class.id,
        className: enrollment.class.name,
        averageScore: 0, // Will be calculated from exam scores
        attendanceRate,
        completionRate: 0, // Will be calculated from assignments/exams
      }
    })

    // Calculate overall progress metrics
    const completedExams = examEnrollments.length
    const totalExams = await prisma.exam.count({
      where: {
        classId: {
          in: classEnrollments.map(e => e.class.id),
        },
      },
    })

    const averageScore = examEnrollments.length > 0
      ? examEnrollments.reduce((acc, curr) => acc + ((curr.score || 0) / curr.exam.totalMarks) * 100, 0) / examEnrollments.length
      : 0

    const attendanceRate = attendanceRecords.length > 0
      ? (attendanceRecords.filter(record => record.status === 'PRESENT').length / attendanceRecords.length) * 100
      : 0

    // Calculate student ranking based on average score
    const ranking = await prisma.examEnrollment.groupBy({
      by: ['userId'],
      _avg: {
        score: true,
      },
      having: {
        score: {
          _avg: {
            gt: averageScore,
          },
        },
      },
    }).then(results => results.length + 1)

    // Format exam scores
    const examScores = examEnrollments.map(enrollment => ({
      examId: enrollment.exam.id,
      examTitle: enrollment.exam.title,
      score: enrollment.score || 0,
      totalMarks: enrollment.exam.totalMarks,
      date: enrollment.exam.startTime.toISOString(),
    }))

    return NextResponse.json({
      examScores,
      classPerformance,
      overallProgress: {
        averageScore,
        completedExams,
        totalExams,
        attendanceRate,
        ranking,
        totalStudents,
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    console.error('Error fetching student progress data:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 