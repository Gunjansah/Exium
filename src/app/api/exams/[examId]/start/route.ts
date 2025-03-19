import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const { examId } = await params
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

    // Update enrollment with start time
    const enrollment = await prisma.examEnrollment.update({
      where: {
        examId_userId: {
          examId: examId,
          userId: user.id
        }
      },
      data: {
        startTime: new Date(),
        status: 'IN_PROGRESS'
      }
    })

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Failed to start exam:', error)
    return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 })
  }
} 