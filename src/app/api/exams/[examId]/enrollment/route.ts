import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    // Await params before using examId
    const { examId } = await params;
    
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const enrollment = await prisma.examEnrollment.findFirst({
      where: {
        examId: examId,  // Use the awaited examId
        userId: user.id,
      },
      select: {
        startTime: true,
        status: true
      }
    })

    return NextResponse.json(enrollment)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 