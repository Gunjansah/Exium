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
    const [enrolledClasses, availableClasses] = await Promise.all([
      // Get classes the student is enrolled in
      prisma.classEnrollment.findMany({
        where: {
          userId: session.user.id,
          role: 'STUDENT',
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              code: true,
              createdAt: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  enrollments: true,
                  exams: true,
                },
              },
              exams: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  startTime: true,
                  endTime: true,
                  status: true,
                  duration: true,
                },
                where: {
                  status: {
                    in: ['PUBLISHED', 'ACTIVE']
                  }
                }
              }
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      }),
      // Get available classes (not enrolled)
      prisma.class.findMany({
        where: {
          enrollments: {
            none: {
              userId: session.user.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          code: true,
          createdAt: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              exams: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    // Format the response
    const formattedEnrolledClasses = enrolledClasses.map(enrollment => ({
      id: enrollment.class.id,
      name: enrollment.class.name,
      description: enrollment.class.description,
      code: enrollment.class.code,
      createdAt: enrollment.class.createdAt.toISOString(),
      teacher: {
        name: `${enrollment.class.teacher.firstName} ${enrollment.class.teacher.lastName}`,
        email: enrollment.class.teacher.email,
      },
      studentsCount: enrollment.class._count.enrollments,
      examsCount: enrollment.class._count.exams,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      exams: enrollment.class.exams.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        startTime: exam.startTime?.toISOString(),
        endTime: exam.endTime?.toISOString(),
        status: exam.status,
        duration: exam.duration,
      })),
    }))

    const formattedAvailableClasses = availableClasses.map(cls => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      code: cls.code,
      createdAt: cls.createdAt.toISOString(),
      teacher: {
        name: `${cls.teacher.firstName} ${cls.teacher.lastName}`,
        email: cls.teacher.email,
      },
      studentsCount: cls._count.enrollments,
      examsCount: cls._count.exams,
    }))

    return NextResponse.json({
      enrolled: formattedEnrolledClasses,
      available: formattedAvailableClasses,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const { classId } = await request.json()

    if (!classId) {
      return new NextResponse('Class ID is required', { status: 400 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findFirst({
      where: {
        userId: session.user.id,
        classId,
      },
    })

    if (existingEnrollment) {
      return new NextResponse('Already enrolled in this class', { status: 400 })
    }

    // Enroll in the class
    const enrollment = await prisma.classEnrollment.create({
      data: {
        userId: session.user.id,
        classId,
        role: 'STUDENT',
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            createdAt: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                exams: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      id: enrollment.class.id,
      name: enrollment.class.name,
      description: enrollment.class.description,
      code: enrollment.class.code,
      createdAt: enrollment.class.createdAt.toISOString(),
      teacher: {
        name: `${enrollment.class.teacher.firstName} ${enrollment.class.teacher.lastName}`,
        email: enrollment.class.teacher.email,
      },
      studentsCount: enrollment.class._count.enrollments,
      examsCount: enrollment.class._count.exams,
      enrolledAt: enrollment.enrolledAt.toISOString(),
    })
  } catch (error) {
    console.error('Error enrolling in class:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 