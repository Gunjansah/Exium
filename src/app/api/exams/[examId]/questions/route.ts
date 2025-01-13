import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const questionSchema = z.object({
  type: z.enum([
    'MULTIPLE_CHOICE',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'TRUE_FALSE',
    'MATCHING',
    'CODING',
  ]),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  points: z.number().min(1),
  content: z.string().min(1, 'Question content is required'),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  timeLimit: z.number().min(0).optional(),
  options: z.array(z.string()).optional(),
  codeTemplate: z.string().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean(),
      })
    )
    .optional(),
  orderIndex: z.number(),
})

// GET /api/exams/[examId]/questions - Get all questions for an exam
export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const { examId } = params
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database to get the ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      console.error('User not found:', session.user.email)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    // First, check if the exam exists
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
    })

    if (!exam) {
      console.error('Exam not found:', examId)
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Get questions directly without enrollment check
    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({ success: true, data: questions })

    /* Commenting out enrollment and status checks
    // For teachers, allow access without enrollment
    if (user.role === 'TEACHER' && exam.createdBy === user.id) {
      const questions = await prisma.question.findMany({
        where: { examId },
        orderBy: { id: 'asc' },
      })
      return NextResponse.json({ success: true, data: questions })
    }

    // For students, check enrollment and exam status
    const enrollment = await prisma.examEnrollment.findFirst({
      where: {
        examId,
        userId: user.id,
      },
    })

    if (!enrollment) {
      console.error('User not enrolled:', user.id, examId)
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this exam' },
        { status: 403 }
      )
    }

    // Check exam status and time window
    const now = new Date()

    if (exam.status !== 'ACTIVE') {
      console.error('Exam not active:', exam.status)
      return NextResponse.json(
        { success: false, error: 'Exam is not active' },
        { status: 403 }
      )
    }

    if (exam.startTime && exam.startTime > now) {
      console.error('Exam not started yet')
      return NextResponse.json(
        { success: false, error: 'Exam has not started yet' },
        { status: 403 }
      )
    }

    if (exam.endTime && exam.endTime < now) {
      console.error('Exam has ended')
      return NextResponse.json(
        { success: false, error: 'Exam has ended' },
        { status: 403 }
      )
    }
    */

  } catch (error) {
    console.error('Failed to fetch questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

// POST /api/exams/[examId]/questions - Create a new question
export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const { examId } = params
    const session = await getServerSession(authConfig)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database to get the ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    // Check if the teacher has access to the exam
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        createdBy: user.id,
      },
    })

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    const question = await prisma.question.create({
      data: {
        ...validatedData,
        examId: examId,
        questionText: validatedData.content,
      },
    })

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error('Failed to create question:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    )
  }
}
