'use client'

import { ClassForm } from '@/components/teacher-dashboard/classes/ClassForm'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function NewClassPage() {
  const router = useRouter()

  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.errors?.[0]?.message || 'Failed to create class')
      }

      // Redirect to the class view page
      router.push(`/teacher/classes/${result.data.id}`)
      router.refresh() // Refresh all server components to update the data

      return result.data
    } catch (error) {
      console.error('Error creating class:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create class. Please try again.',
        variant: 'destructive',
      })
      throw error
    }
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Class</h1>
          <p className="text-muted-foreground">
            Create a new class and manage your students.
          </p>
        </div>

        <ClassForm onSubmit={handleSubmit} />
      </div>
    </TeacherDashboardLayout>
  )
}