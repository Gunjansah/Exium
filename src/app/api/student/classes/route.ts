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
        select: {
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              startDate: true,
              endDate: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  students: true,
                  exams: true,
                },
              },
            },
          },
          joinedAt: true,
        },
        orderBy: {
          joinedAt: 'desc',
        },
      }),
      // Get available classes (not enrolled)
      prisma.class.findMany({
        where: {
          students: {
            none: {
              userId: session.user.id,
            },
          },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              students: true,
              exams: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      }),
    ])

    // Format the response
    const formattedEnrolledClasses = enrolledClasses.map(enrollment => ({
      id: enrollment.class.id,
      name: enrollment.class.name,
      description: enrollment.class.description,
      startDate: enrollment.class.startDate.toISOString(),
      endDate: enrollment.class.endDate?.toISOString(),
      teacher: {
        name: `${enrollment.class.teacher.firstName} ${enrollment.class.teacher.lastName}`,
        email: enrollment.class.teacher.email,
      },
      studentsCount: enrollment.class._count.students,
      examsCount: enrollment.class._count.exams,
      joinedAt: enrollment.joinedAt.toISOString(),
    }))

    const formattedAvailableClasses = availableClasses.map(cls => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      startDate: cls.startDate.toISOString(),
      endDate: cls.endDate?.toISOString(),
      teacher: {
        name: `${cls.teacher.firstName} ${cls.teacher.lastName}`,
        email: cls.teacher.email,
      },
      studentsCount: cls._count.students,
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
        status: 'ACTIVE',
      },
      select: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                students: true,
                exams: true,
              },
            },
          },
        },
        joinedAt: true,
      },
    })

    return NextResponse.json({
      id: enrollment.class.id,
      name: enrollment.class.name,
      description: enrollment.class.description,
      startDate: enrollment.class.startDate.toISOString(),
      endDate: enrollment.class.endDate?.toISOString(),
      teacher: {
        name: `${enrollment.class.teacher.firstName} ${enrollment.class.teacher.lastName}`,
        email: enrollment.class.teacher.email,
      },
      studentsCount: enrollment.class._count.students,
      examsCount: enrollment.class._count.exams,
      joinedAt: enrollment.joinedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error enrolling in class:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 