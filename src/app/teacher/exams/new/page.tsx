'use client'

import { ExamForm } from '@/components/teacher-dashboard/exams/ExamForm'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function NewExamPage() {
  const router = useRouter()

  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/teacher/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.errors?.[0]?.message || 'Failed to create exam')
      }

      // Redirect to the exam view page
      router.push(`/teacher/exams/${result.data.id}`)
      router.refresh() // Refresh all server components to update the data

      return result.data
    } catch (error) {
      console.error('Error creating exam:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create exam. Please try again.',
        variant: 'destructive',
      })
      throw error
    }
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
          <p className="text-muted-foreground">
            Create a new exam and add questions to it.
          </p>
        </div>

        <ExamForm onSubmit={handleSubmit} />
      </div>
    </TeacherDashboardLayout>
  )
}
