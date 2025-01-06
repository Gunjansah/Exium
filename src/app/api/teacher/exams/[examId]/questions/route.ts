import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const questionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'MATCHING', 'CODING']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  points: z.number().min(0),
  content: z.string().min(1, 'Question content is required'),
  correctAnswer: z.string().optional(),
  options: z.any().optional(),
  explanation: z.string().optional(),
  orderIndex: z.number(),
  timeLimit: z.number().optional(),
  codeTemplate: z.string().optional(),
  testCases: z.any().optional(),
})

// GET /api/teacher/exams/[examId]/questions - Get all questions for an exam
export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify exam ownership
    const exam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
        createdBy: user.id,
      },
    })

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    const questions = await prisma.question.findMany({
      where: {
        examId: params.examId,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    })

    return NextResponse.json({ success: true, data: questions })
  } catch (error) {
    console.error('Failed to fetch questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

// POST /api/teacher/exams/[examId]/questions - Create a new question
export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify exam ownership
    const exam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
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
        examId: params.examId,
      },
    })

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to create question:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    )
  }
}

// PATCH /api/teacher/exams/[examId]/questions/reorder - Reorder questions
export async function PATCH(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify exam ownership
    const exam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
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
    const { questions } = body

    // Update order indices in a transaction
    await prisma.$transaction(
      questions.map((q: { id: string; orderIndex: number }) =>
        prisma.question.update({
          where: { id: q.id },
          data: { orderIndex: q.orderIndex },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reorder questions' },
      { status: 500 }
    )
  }
}
