import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reorderSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      orderIndex: z.number(),
    })
  ),
})

// PUT /api/exams/[examId]/questions/reorder - Reorder questions
export async function PUT(
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
    const { questions } = reorderSchema.parse(body)

    // Update questions in a transaction
    await prisma.$transaction(
      questions.map((question) =>
        prisma.question.update({
          where: { id: question.id },
          data: { orderIndex: question.orderIndex },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder questions:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to reorder questions' },
      { status: 500 }
    )
  }
}
