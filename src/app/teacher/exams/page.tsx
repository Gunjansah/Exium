'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Exam {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED'
  startTime?: string
  endTime?: string
  class: {
    id: string
    name: string
  }
}

export default function ExamsPage() {
  const router = useRouter()

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/exams')
      if (!response.ok) {
        throw new Error('Failed to fetch exams')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch exams')
      }
      return result.data
    },
  })

  if (isLoading) {
    return <LoadingPageSkeleton />
  }

  const getStatusColor = (status: Exam['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
            <p className="text-muted-foreground">
              Manage all your exams across different classes
            </p>
          </div>
          <Button onClick={() => router.push('/teacher/exams/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams?.map((exam) => (
            <Card
              key={exam.id}
              className="cursor-pointer hover:bg-accent/5"
              onClick={() => router.push(`/teacher/exams/${exam.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className={getStatusColor(exam.status)}
                  >
                    {exam.status.charAt(0) + exam.status.slice(1).toLowerCase()}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/teacher/exams/${exam.id}/edit`)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/teacher/exams/${exam.id}/questions`)
                      }}
                    >
                      Questions
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{exam.title}</CardTitle>
                <CardDescription>{exam.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Class: {exam.class.name}
                  </p>
                  {exam.startTime && (
                    <p className="text-sm text-muted-foreground">
                      Starts: {new Date(exam.startTime).toLocaleString()}
                    </p>
                  )}
                  {exam.endTime && (
                    <p className="text-sm text-muted-foreground">
                      Ends: {new Date(exam.endTime).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TeacherDashboardLayout>
  )
}