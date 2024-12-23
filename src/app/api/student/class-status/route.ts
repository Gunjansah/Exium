import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the class code from query params
    const { searchParams } = new URL(request.url)
    const classCode = searchParams.get('code') || 'CSC307'

    // Check class enrollment
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        userId: session.user.id,
        class: {
          code: classCode
        }
      },
      include: {
        class: true
      }
    })

    // Get all exams for this class
    const exams = await prisma.exam.findMany({
      where: {
        class: {
          code: classCode
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Get upcoming exams
    const upcomingExams = await prisma.exam.findMany({
      where: {
        class: {
          code: classCode
        },
        status: 'ACTIVE',
        startTime: {
          gte: new Date()
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json({
      enrollment: enrollment ? {
        enrolled: true,
        classId: enrollment.classId,
        className: enrollment.class.name,
        code: enrollment.class.code,
        role: enrollment.role,
        enrolledAt: enrollment.enrolledAt
      } : {
        enrolled: false
      },
      exams: {
        total: exams.length,
        upcoming: upcomingExams.length,
        details: exams.map(exam => ({
          id: exam.id,
          title: exam.title,
          status: exam.status,
          startTime: exam.startTime,
          endTime: exam.endTime
        }))
      }
    })

  } catch (error) {
    console.error('Error checking class status:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 