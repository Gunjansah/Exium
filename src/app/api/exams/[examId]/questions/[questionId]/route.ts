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

// PUT /api/exams/[examId]/questions/[questionId] - Update a question
export async function PUT(
  request: Request,
  { params }: { params: { examId: string; questionId: string } }
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

    const question = await prisma.question.findUnique({
      where: {
        id: params.questionId,
        examId: params.examId,
      },
    })

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    const updatedQuestion = await prisma.question.update({
      where: {
        id: params.questionId,
      },
      data: validatedData,
    })

    return NextResponse.json({ success: true, data: updatedQuestion })
  } catch (error) {
    console.error('Failed to update question:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    )
  }
}

// DELETE /api/exams/[examId]/questions/[questionId] - Delete a question
export async function DELETE(
  request: Request,
  { params }: { params: { examId: string; questionId: string } }
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

    const question = await prisma.question.findUnique({
      where: {
        id: params.questionId,
        examId: params.examId,
      },
    })

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      )
    }

    await prisma.question.delete({
      where: {
        id: params.questionId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete question:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    )
  }
}
