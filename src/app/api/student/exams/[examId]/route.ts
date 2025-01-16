import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const examId = params.examId
    const userId = session.user.id

    // Fetch exam with questions and student's enrollment
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          select: {
            id: true,
            content: true,
            type: true,
            points: true,
            options: true,
            timeLimit: true,
          },
        },
        enrollments: {
          where: { userId },
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    if (!exam) {
      return new NextResponse('Exam not found', { status: 404 })
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_userId: {
          classId: exam.classId,
          userId,
        },
      },
    })

    if (!enrollment) {
      return new NextResponse('Not enrolled in this class', { status: 403 })
    }

    // Return exam data with security settings
    return NextResponse.json({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      questions: exam.questions,
      blockClipboard: exam.blockClipboard,
      blockKeyboardShortcuts: exam.blockKeyboardShortcuts,
      blockMultipleTabs: exam.blockMultipleTabs,
      blockRightClick: exam.blockRightClick,
      blockSearchEngines: exam.blockSearchEngines,
      browserMonitoring: exam.browserMonitoring,
      deviceTracking: exam.deviceTracking,
      fullScreenMode: exam.fullScreenMode,
      maxViolations: exam.maxViolations,
      periodicUserValidation: exam.periodicUserValidation,
      resumeCount: exam.resumeCount,
      screenshotBlocking: exam.screenshotBlocking,
      webcamRequired: exam.webcamRequired,
    })
  } catch (error) {
    console.error('Failed to fetch exam:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 