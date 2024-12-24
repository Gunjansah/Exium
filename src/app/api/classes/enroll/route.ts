import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/app/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { classId, code } = body

    if (!classId || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the class code
    const classToEnroll = await prisma.class.findUnique({
      where: {
        id: classId,
      },
    })

    if (!classToEnroll) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (classToEnroll.code !== code) {
      return NextResponse.json({ error: 'Invalid class code' }, { status: 400 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findFirst({
      where: {
        userId: session.user.id,
        classId: classId,
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this class' }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        userId: session.user.id,
        classId: classId,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error('Error enrolling in class:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
