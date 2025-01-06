'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamForm } from '@/components/teacher-dashboard/exams/ExamForm'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { toast } from 'sonner'
import { CreateExamRequest } from '@/types/exam'

interface Class {
  id: string
  name: string
}

export default function NewExamPage() {
  const router = useRouter()
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: classesResponse, isLoading } = useQuery<{ success: true; data: Class[] }>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/classes')
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch classes')
      }
      return data
    },
  })

  const classes = classesResponse?.data || []

  const handleSubmit = async (data: Omit<CreateExamRequest, 'classId'>) => {
    if (!selectedClass) {
      toast.error('Please select a class for this exam')
      return
    }

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        classId: selectedClass,
        duration: Number(data.duration),
        points: data.questions?.map(q => Number(q.points)),
        timeLimit: data.questions?.map(q => q.timeLimit ? Number(q.timeLimit) : undefined),
      }

      console.log('Submitting exam:', payload)

      const response = await fetch('/api/teacher/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create exam')
      }

      toast.success('Exam created successfully')
      router.push(`/teacher/exams/${result.data.id}`)
    } catch (error) {
      console.error('Error creating exam:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create exam')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingPageSkeleton />
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
          <p className="text-muted-foreground">
            Create a new exam for your class
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Fill in the details for your new exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ExamForm 
              onSubmit={handleSubmit} 
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </TeacherDashboardLayout>
  )
}
