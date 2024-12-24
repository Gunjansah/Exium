import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'You must be logged in to view available classes'
      }, {
        status: 401
      })
    }

    // Get all available classes that the user is not already enrolled in
    const availableClasses = await prisma.class.findMany({
      where: {
        NOT: {
          enrollments: {
            some: {
              userId: session.user.id
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      classes: availableClasses
    })
  } catch (error) {
    console.error('Error fetching available classes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available classes'
    }, {
      status: 500
    })
  }
}
