'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { GraduationCap, Users, Calendar, FileText, Loader2 } from 'lucide-react'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

interface Class {
  id: string
  name: string
  description: string | null
  code: string
  createdAt: string
  teacher: {
    name: string
    email: string
  }
  studentsCount: number
  examsCount: number
  enrolledAt?: string
  exams?: Array<{
    id: string
    title: string
    description: string | null
    startTime: string | null
    endTime: string | null
    status: string
    duration: number
  }>
}
  
interface ClassesData {
  enrolled: Class[]
  available: Class[]
}

interface EnrollmentRequest {
  classId: string;
  status: string;
  createdAt: string;
}

export default function ClassesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: classes, isLoading, refetch } = useQuery<ClassesData>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await fetch('/api/student/classes')
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      return response.json()
    },
    staleTime: 30000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  })

  const { data: enrollmentRequests } = useQuery<EnrollmentRequest[]>({
    queryKey: ['enrollment-requests'],
    queryFn: async () => {
      const response = await fetch('/api/student/classes/enrollmentRequests')
      if (!response.ok) {
        throw new Error('Failed to fetch enrollment requests')
      }
      return response.json()
    },
  })

  const isPending = (classId: string) => {
    return enrollmentRequests?.some(request => request.classId === classId) ?? false
  }

  const handleEnroll = async (classId: string) => {
    try {
      const response = await fetch('/api/student/classes/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to enroll in class')
      }

      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['enrollment-requests'] })
      ])
      
      toast({
        title: 'Success',
        description: 'Enrollment request sent successfully',
      })
    } catch (error) {
      console.error('Error enrolling in class:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enroll in class',
        variant: 'destructive',
      })
    }
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
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">
            View and manage your class enrollments
          </p>
        </div>

        <Tabs defaultValue="enrolled" className="space-y-4">
          <TabsList>
            <TabsTrigger value="enrolled">Enrolled Classes</TabsTrigger>
            <TabsTrigger value="available">Available Classes</TabsTrigger>
          </TabsList>

          <TabsContent value="enrolled" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {classes?.enrolled.map((cls) => (
                <Card key={cls.id}>
                  <CardHeader>
                    <CardTitle>{cls.name}</CardTitle>
                    <CardDescription>{cls.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{cls.teacher.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{cls.studentsCount} students</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Created {format(new Date(cls.createdAt), 'PPP')}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{cls.examsCount} exams</span>
                        </div>
                      </div>
                      {cls.enrolledAt && (
                        <div className="text-xs text-muted-foreground">
                          Joined {format(new Date(cls.enrolledAt), 'PPP')}
                        </div>
                      )}
                      {cls.exams && cls.exams.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-semibold">Upcoming Exams</h4>
                          {cls.exams.map(exam => (
                            <div key={exam.id} className="rounded-md border p-3 text-sm">
                              <div className="font-medium">{exam.title}</div>
                              {exam.description && (
                                <div className="text-muted-foreground text-xs mt-1">{exam.description}</div>
                              )}
                              <div className="flex items-center gap-x-4 mt-2 text-xs">
                                <div className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  <span>
                                    {exam.startTime ? format(new Date(exam.startTime), 'PPp') : 'Not scheduled'}
                                  </span>
                                </div>
                                <div>Duration: {exam.duration} minutes</div>
                                <div className="ml-auto">
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
                                    {exam.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {classes?.enrolled.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Classes Yet</h3>
                  <p className="text-muted-foreground">
                    You haven't enrolled in any classes yet. Check out the available classes.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {classes?.available.map((cls) => (
                <Card key={cls.id}>
                  <CardHeader>
                    <CardTitle>{cls.name}</CardTitle>
                    <CardDescription>{cls.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{cls.teacher.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{cls.studentsCount} students</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Created {format(new Date(cls.createdAt), 'PPP')}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{cls.examsCount} exams</span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleEnroll(cls.id)}
                        disabled={isPending(cls.id)}
                        variant={isPending(cls.id) ? "outline" : "default"}
                      >
                        {isPending(cls.id) ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enrollment Pending
                          </span>
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {classes?.available.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Available Classes</h3>
                  <p className="text-muted-foreground">
                    There are no new classes available for enrollment at this time.
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
