'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { LoadingPageSkeleton } from '@/components/loading'
import { Plus, PencilIcon, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ExamStatus } from '@prisma/client'

interface Exam {
  id: string
  title: string
  description: string | null
  duration: number
  status: ExamStatus
  createdAt: string
  class: {
    id: string
    name: string
  }
  _count: {
    questions: number
    submissions: number
  }
}

export default function ExamsPage() {
  const router = useRouter()

  const { data: exams, isLoading, error } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/teacher/exams')
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to fetch exams')
        }
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch exams')
        }
        return result.data || [] // Ensure we always return an array
      } catch (error) {
        console.error('Error fetching exams:', error)
        throw error
      }
    },
    initialData: [], // Start with empty array instead of undefined
    // Ensure data is always fresh
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const getStatusColor = (status: ExamStatus) => {
    switch (status) {
      case ExamStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800'
      case ExamStatus.PUBLISHED:
        return 'bg-blue-100 text-blue-800'
      case ExamStatus.ACTIVE:
        return 'bg-green-100 text-green-800'
      case ExamStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading state with header
  if (isLoading) {
    return (
      <TeacherDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
              <p className="text-muted-foreground">
                Manage your exams and view their status.
              </p>
            </div>
            <Button onClick={() => router.push('/teacher/exams/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </div>
          <LoadingPageSkeleton />
        </div>
      </TeacherDashboardLayout>
    )
  }

  // Show error state
  if (error) {
    return (
      <TeacherDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
              <p className="text-muted-foreground">
                Manage your exams and view their status.
              </p>
            </div>
            <Button onClick={() => router.push('/teacher/exams/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </div>
          <Card>
            <CardContent className="py-6 text-center text-red-500">
              Error loading exams. Please try again later.
            </CardContent>
          </Card>
        </div>
      </TeacherDashboardLayout>
    )
  }

  const activeExams = exams.filter(exam => exam.status === ExamStatus.ACTIVE)

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
            <p className="text-muted-foreground">
              Manage your exams and view their status.
            </p>
          </div>
          <Button onClick={() => router.push('/teacher/exams/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </div>

        <div className="grid gap-6">
          {exams.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No exams found. Create your first exam to get started.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Active Exams */}
              {activeExams.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Active Exams</h2>
                  <div className="grid gap-4">
                    {activeExams.map((exam) => (
                      <ExamCard key={exam.id} exam={exam} getStatusColor={getStatusColor} />
                    ))}
                  </div>
                </div>
              )}

              {/* All Exams */}
              <div>
                <h2 className="text-xl font-semibold mb-4">All Exams</h2>
                <div className="grid gap-4">
                  {exams.map((exam) => (
                    <ExamCard key={exam.id} exam={exam} getStatusColor={getStatusColor} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TeacherDashboardLayout>
  )
}

// Separate component for exam card to improve readability
function ExamCard({ exam, getStatusColor }: { exam: Exam, getStatusColor: (status: ExamStatus) => string }) {
  const router = useRouter()
  
  return (
    <Card key={exam.id}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{exam.title}</h3>
            <p className="text-sm text-muted-foreground">
              Class: {exam.class.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(exam.status)}>
              {exam.status}
            </Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/teacher/exams/${exam.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">{exam.duration} minutes</p>
          </div>
          <div>
            <p className="text-muted-foreground">Questions</p>
            <p className="font-medium">{exam._count.questions}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Submissions</p>
            <p className="font-medium">{exam._count.submissions}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">
              {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}