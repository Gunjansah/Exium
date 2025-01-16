import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = session.user.id

    // Find the demo class
    const demoClass = await prisma.class.findUnique({
      where: {
        code: 'DEMO101',
      },
    })

    if (!demoClass) {
      return new NextResponse(JSON.stringify({ error: 'Demo class not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Enroll the user in the demo class
    const enrollment = await prisma.classEnrollment.upsert({
      where: {
        classId_userId: {
          classId: demoClass.id,
          userId,
        },
      },
      update: {},
      create: {
        classId: demoClass.id,
        userId,
        role: 'STUDENT',
      },
    })

    return new NextResponse(JSON.stringify({ success: true, enrollment }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Failed to enroll in demo class:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to enroll in demo class' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 