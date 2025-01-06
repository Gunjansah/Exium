'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamForm } from '@/components/teacher-dashboard/exams/ExamForm'
import { toast } from 'sonner'

interface Props {
  params: {
    classId: string
  }
}

export default function NewClassExamPage({ params }: Props) {
  const router = useRouter()
  const classId = params.classId

  const { data: classData, isLoading } = useQuery({
    queryKey: ['class', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch class')
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch class')
      }
      return data.data
    },
  })

  const handleSubmit = async (data: any) => {
    try {
      // Convert dates to ISO strings for API
      const formattedData = {
        ...data,
        startTime: data.startTime?.toISOString() || null,
        endTime: data.endTime?.toISOString() || null,
        classId,
      }

      const response = await fetch('/api/teacher/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create exam')
      }

      toast.success('Exam created successfully')
      router.push(`/teacher/classes/${classId}/exams/${result.data.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create exam')
      console.error('Error creating exam:', error)
    }
  }

  if (isLoading) {
    return <LoadingPageSkeleton />
  }

  if (!classData) {
    return null
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
          <p className="text-muted-foreground">
            Create a new exam for {classData.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Fill in the details for your new exam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExamForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </TeacherDashboardLayout>
  )
}
