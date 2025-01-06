'use client'

import { useParams, useRouter } from 'next/navigation'
import { ExamList } from '@/components/teacher-dashboard/exams/ExamList'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useClassExams } from '@/hooks/use-exams'
import { toast } from 'sonner'
import { LoadingPage } from '@/components/loading'

export default function ExamsPage() {
  const router = useRouter()
  const params = useParams<{ classId: string }>()
  const { data: exams, isLoading, error, deleteExam } = useClassExams(params.classId)

  if (isLoading) {
    return <LoadingPage />
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) {
      return
    }

    try {
      await deleteExam(examId)
      toast.success('Exam deleted successfully')
    } catch (error) {
      toast.error('Failed to delete exam')
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground mt-2">
            Manage your exams and assignments
          </p>
        </div>
        <Button
          onClick={() => router.push(`/teacher/classes/${params.classId}/exams/new`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      {exams && exams.length > 0 ? (
        <ExamList
          exams={exams}
          onDeleteExam={handleDeleteExam}
          classId={params.classId}
        />
      ) : (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <h2 className="text-xl font-medium">No exams yet</h2>
            <p className="text-muted-foreground mt-1">
              Create your first exam to get started
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push(`/teacher/classes/${params.classId}/exams/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
