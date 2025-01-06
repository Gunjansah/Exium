import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ExamDetail } from '@/components/teacher-dashboard/exams/exam-detail'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/app/lib/auth.config'

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
          select: {
            id: true,
            type: true,
            difficulty: true,
            points: true,
            content: true,
            orderIndex: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
        _count: {
          select: {
            questions: true,
            enrollments: true,
            submissions: true,
          },
        },
      },
    })

    return exam
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
