import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExamEnrollmentStatus, Question, QuestionType, Prisma } from '@prisma/client'

interface QuestionOption {
  text: string
  isCorrect: boolean
}

interface ExamAnswer {
  [questionId: string]: string | string[]
}

type QuestionWithParsedOptions = Omit<Question, 'options'> & {
  options: QuestionOption[] | null
}

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
    const userId = session.user.id
    const { answers, autoSubmitted } = await request.json() as { 
      answers: ExamAnswer
      autoSubmitted: boolean 
    }

    // Verify exam enrollment
    const enrollment = await prisma.examEnrollment.findFirst({
      where: {
        examId,
        userId,
        status: ExamEnrollmentStatus.IN_PROGRESS,
      },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    })

    if (!enrollment) {
      return new NextResponse('No active exam session found', { status: 404 })
    }

    // Create submissions for each answer
    if (answers) {
      await Promise.all(
        Object.entries(answers).map(async ([questionId, answer]) => {
          const question = enrollment.exam.questions.find(q => q.id === questionId)
          if (!question) return

          let parsedOptions: QuestionOption[] | null = null
          try {
            parsedOptions = question.options ? JSON.parse(question.options as string) : null
          } catch (e) {
            console.error('Failed to parse question options:', e)
          }

          const questionWithParsedOptions: QuestionWithParsedOptions = {
            ...question,
            options: parsedOptions,
          }

          return prisma.submission.create({
            data: {
              examId,
              userId,
              answer: JSON.stringify(answer),
              score: question.type === QuestionType.MULTIPLE_CHOICE ||
                     question.type === QuestionType.TRUE_FALSE
                ? calculateScore(answer, questionWithParsedOptions)
                : null,
            },
          })
        })
      )
    }

    // Update exam enrollment status
    await prisma.examEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: ExamEnrollmentStatus.SUBMITTED,
        endTime: new Date(),
      },
    })

    // Create proctoring log
    await prisma.proctoringLog.create({
      data: {
        examId,
        userId,
        eventType: autoSubmitted ? 'AUTO_SUBMITTED' : 'MANUAL_SUBMIT',
        meta: {
          timestamp: new Date().toISOString(),
          violationCount: enrollment.violationCount,
        } as Prisma.JsonObject,
      },
    })

    return new NextResponse(
      JSON.stringify({
        status: 'SUBMITTED',
        message: autoSubmitted
          ? 'Exam auto-submitted due to security violations or time limit'
          : 'Exam submitted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Failed to submit exam:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function calculateScore(answer: string | string[], question: QuestionWithParsedOptions): number {
  if (question.type === QuestionType.MULTIPLE_CHOICE && question.options) {
    const correctOptions = question.options.filter(opt => opt.isCorrect)
    const selectedOptions = Array.isArray(answer) ? answer : [answer]
    
    if (correctOptions.length === selectedOptions.length) {
      const allCorrect = selectedOptions.every(selected =>
        correctOptions.some(correct => correct.text === selected)
      )
      return allCorrect ? question.points : 0
    }
    return 0
  }

  if (question.type === QuestionType.TRUE_FALSE) {
    return answer === question.correctAnswer ? question.points : 0
  }

  return 0
} 