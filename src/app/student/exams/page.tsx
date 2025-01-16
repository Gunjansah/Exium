'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'

interface Exam {
  id: string
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  duration: number
  status: string
  className: string
  classId: string
  enrollment: {
    id: string
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED'
    startTime: string | null
    endTime: string | null
  } | null
}

interface ExamsData {
  upcoming: Exam[]
  active: Exam[]
  completed: Exam[]
}

export default function ExamsPage() {
  const router = useRouter()
  const { data: exams, isLoading } = useQuery<ExamsData>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await fetch('/api/student/exams')
      if (!response.ok) {
        throw new Error('Failed to fetch exams')
      }
      return response.json()
    },
    staleTime: 30000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  })

  const handleStartExam = async (examId: string) => {
    router.push(`/student/exams/${examId}/take`)
  }

  const handleResumeExam = async (examId: string) => {
    router.push(`/student/exams/${examId}/take`)
  }

  const handleViewResult = async (examId: string) => {
    router.push(`/student/exams/${examId}/result`)
  }

  if (isLoading) {
    return (
      <StudentDashboardLayout>
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex flex-col space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </StudentDashboardLayout>
    )
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground">
            View and manage your exams
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Exams</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
            <TabsTrigger value="completed">Completed Exams</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {exams?.active.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.className}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {exam.enrollment?.status || exam.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{exam.duration} minutes</span>
                        </div>
                        {exam.description && (
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{exam.description}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {exam.startTime ? format(new Date(exam.startTime), 'PPp') : 'Not scheduled'}
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => exam.enrollment?.status === 'IN_PROGRESS' 
                          ? handleResumeExam(exam.id)
                          : handleStartExam(exam.id)
                        }
                        disabled={exam.startTime ? new Date(exam.startTime) > new Date() : false}
                      >
                        {exam.enrollment?.status === 'IN_PROGRESS' ? 'Resume Exam' : 'Start Exam'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {exams?.active.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Active Exams</h3>
                  <p className="text-muted-foreground">
                    You don't have any exams in progress at the moment.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {exams?.upcoming.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.className}</CardDescription>
                      </div>
                      <Badge>Upcoming</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{exam.duration} minutes</span>
                        </div>
                        {exam.description && (
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{exam.description}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {exam.startTime ? format(new Date(exam.startTime), 'PPp') : 'Not scheduled'}
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleStartExam(exam.id)}
                        disabled={exam.startTime ? new Date(exam.startTime) > new Date() : false}
                      >
                        Start Exam
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {exams?.upcoming.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Upcoming Exams</h3>
                  <p className="text-muted-foreground">
                    You don't have any upcoming exams scheduled.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {exams?.completed.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.className}</CardDescription>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 text-sm">
                        {exam.description && (
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{exam.description}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{exam.duration} minutes</span>
                        </div>
                      </div>
                      {exam.enrollment?.endTime && (
                        <div className="text-sm text-muted-foreground">
                          Completed: {format(new Date(exam.enrollment.endTime), 'PPp')}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleViewResult(exam.id)}
                      >
                        View Result
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {exams?.completed.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Completed Exams</h3>
                  <p className="text-muted-foreground">
                    You haven't completed any exams yet.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StudentDashboardLayout>
  )
} 