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

    // Get student profile with enrolled classes
    const profile = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        avatar: true,
        bio: true,
        studentId: true,
        enrolledAt: true,
        classEnrollments: {
          where: {
            role: 'STUDENT',
            status: 'ACTIVE',
          },
          select: {
            class: {
              select: {
                id: true,
                name: true,
                teacher: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!profile) {
      return new NextResponse('Profile not found', { status: 404 })
    }

    // Format the response
    return NextResponse.json({
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth?.toISOString(),
      address: profile.address,
      avatar: profile.avatar,
      bio: profile.bio,
      studentId: profile.studentId,
      enrollmentDate: profile.enrolledAt.toISOString(),
      enrolledClasses: profile.classEnrollments.map(enrollment => ({
        id: enrollment.class.id,
        name: enrollment.class.name,
        teacher: {
          name: `${enrollment.class.teacher.firstName} ${enrollment.class.teacher.lastName}`,
        },
      })),
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 