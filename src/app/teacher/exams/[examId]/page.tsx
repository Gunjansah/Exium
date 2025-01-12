import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ExamDetail } from '@/components/teacher-dashboard/exams/exam-detail'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'
import { ExamStatus } from '@prisma/client'

interface Question {
  id: string
  type: string
  difficulty: string
  points: number
  content: string
  orderIndex: number
}

async function getExam(examId: string) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) return null

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'TEACHER') return null

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        createdBy: user.id,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
          select: {
            id: true,
            type: true,
            difficulty: true,
            points: true,
            content: true,
            orderIndex: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            submissions: true,
            questions: true,
          },
        },
      },
    })

    if (!exam) return null

    // Transform questions to match the expected format
    const transformedQuestions: Question[] = exam.questions.map(q => ({
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      points: q.points,
      content: q.content,
      orderIndex: q.orderIndex,
    }))

    // Map exam status to expected format
    let status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED'
    switch (exam.status) {
      case ExamStatus.ACTIVE:
        status = 'ACTIVE'
        break
      case ExamStatus.COMPLETED:
        status = 'COMPLETED'
        break
      case ExamStatus.PUBLISHED:
        status = 'SCHEDULED'
        break
      default:
        status = 'DRAFT'
    }

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      status,
      startTime: exam.startTime?.toISOString() || null,
      endTime: exam.endTime?.toISOString() || null,
      class: exam.class,
      questions: transformedQuestions,
      _count: exam._count,
    }
  } catch (error) {
    console.error('Error fetching exam:', error)
    return null
  }
}

export default async function ExamPage({ params }: { params: { examId: string } }) {
  const exam = await getExam(params.examId)
  
  if (!exam) {
    notFound()
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <Suspense fallback={<LoadingPageSkeleton />}>
          <ExamDetail exam={exam} />
        </Suspense>
      </div>
    </TeacherDashboardLayout>
  )
}
