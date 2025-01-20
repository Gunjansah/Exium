import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { QuestionType, DifficultyLevel } from '@prisma/client'

const questionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(QuestionType.MULTIPLE_CHOICE),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })).min(2),
  }),
  z.object({
    type: z.literal(QuestionType.SHORT_ANSWER),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    correctAnswer: z.string().min(1),
  }),
  z.object({
    type: z.literal(QuestionType.LONG_ANSWER),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    rubric: z.string().optional(),
  }),
  z.object({
    type: z.literal(QuestionType.TRUE_FALSE),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    correctAnswer: z.enum(['true', 'false']),
  }),
  z.object({
    type: z.literal(QuestionType.MATCHING),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    matchingPairs: z.array(z.object({
      left: z.string().min(1),
      right: z.string().min(1),
    })).min(2),
  }),
  z.object({
    type: z.literal(QuestionType.CODING),
    content: z.string().min(1),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    codeTemplate: z.string().optional(),
    programmingLanguage: z.string().min(1),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string().min(1),
      isHidden: z.boolean(),
      explanation: z.string().optional(),
    })).min(1),
  }),
])

// GET /api/teacher/exams/[examId]/questions - Get all questions for an exam
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
    if (!examId) {
      return new NextResponse('Exam ID is required', { status: 400 })
    }

    // Verify the exam belongs to the teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        createdBy: session.user.id,
      },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    })

    if (!exam) {
      return new NextResponse('Exam not found or unauthorized', { status: 404 })
    }

    return NextResponse.json(exam.questions)
  } catch (error) {
    console.error('Failed to fetch questions:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const examId = params.examId
    if (!examId) {
      return new NextResponse('Exam ID is required', { status: 400 })
    }

    // Verify the exam belongs to the teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        createdBy: session.user.id,
      },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!exam) {
      return new NextResponse('Exam not found or unauthorized', { status: 404 })
    }

    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    // Get the next order index
    const nextOrderIndex = exam.questions[0] ? exam.questions[0].orderIndex + 1 : 0

    // Create the question
    const question = await prisma.question.create({
      data: {
        examId,
        type: validatedData.type,
        content: validatedData.content,
        points: validatedData.points,
        difficulty: validatedData.difficulty,
        explanation: validatedData.explanation,
        timeLimit: validatedData.timeLimit,
        orderIndex: nextOrderIndex,
        ...(validatedData.type === QuestionType.MULTIPLE_CHOICE && {
          options: validatedData.options,
        }),
        ...(validatedData.type === QuestionType.SHORT_ANSWER && {
          correctAnswer: validatedData.correctAnswer,
        }),
        ...(validatedData.type === QuestionType.LONG_ANSWER && {
          rubric: validatedData.rubric,
        }),
        ...(validatedData.type === QuestionType.TRUE_FALSE && {
          correctAnswer: validatedData.correctAnswer,
        }),
        ...(validatedData.type === QuestionType.MATCHING && {
          options: validatedData.matchingPairs,
        }),
        ...(validatedData.type === QuestionType.CODING && {
          codeTemplate: validatedData.codeTemplate,
          testCases: validatedData.testCases,
        }),
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error('Failed to add question:', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid question data', errors: error.errors }),
        { status: 400 }
      )
    }
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
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
    const session = await getServerSession(authOptions)

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

export async function DELETE(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { questionId } = await request.json()
    if (!questionId) {
      return new NextResponse('Question ID is required', { status: 400 })
    }

    // Verify the exam and question belong to the teacher
    const exam = await prisma.exam.findFirst({
      where: {
        id: params.examId,
        createdBy: session.user.id,
        questions: {
          some: {
            id: questionId,
          },
        },
      },
    })

    if (!exam) {
      return new NextResponse('Exam or question not found or unauthorized', { status: 404 })
    }

    // Delete the question
    await prisma.question.delete({
      where: {
        id: questionId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete question:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    )
  }
}
