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
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the teacher has access to the exam
    const exam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
        createdBy: session.user.id,
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

// POST /api/exams/[examId]/questions - Create a new question
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

    // Check if the teacher has access to the exam
    const exam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
        createdBy: session.user.id,
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
