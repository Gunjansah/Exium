import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = session.user.id

    // Get all classes the student is enrolled in
    const enrolledClasses = await prisma.classEnrollment.findMany({
      where: {
        userId,
        role: 'STUDENT',
      },
      select: {
        classId: true,
      },
    })

    const classIds = enrolledClasses.map(e => e.classId)

    // Get active exams from enrolled classes
    const activeExams = await prisma.exam.findMany({
      where: {
        classId: {
          in: classIds,
        },
        status: {
          in: ['PUBLISHED', 'ACTIVE'],
        },
        // Only show exams that are within their time window
        OR: [
          {
            startTime: null, // No time restriction
          },
          {
            startTime: {
              lte: new Date(),
            },
            endTime: {
              gte: new Date(),
            },
          },
        ],
        // Exclude exams that the student has already completed
        NOT: {
          enrollments: {
            some: {
              userId,
              status: {
                in: ['COMPLETED', 'SUBMITTED'],
              },
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        startTime: true,
        endTime: true,
        status: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Add a dummy exam for testing
    const dummyExam = {
      id: "dummy-exam-123",
      title: "Sample Mathematics Exam",
      description: "This is a sample exam to test the secure exam environment. It includes various question types and security features.",
      duration: 60, // 60 minutes
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Available for 7 days
      status: "PUBLISHED",
      _count: {
        questions: 5
      }
    }

    // Return the dummy exam along with any real exams
    return new NextResponse(JSON.stringify([dummyExam, ...activeExams]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to fetch active exams:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 