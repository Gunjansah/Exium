'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, GraduationCap, Plus, Users, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Exam {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED'
  startTime: string | null
  endTime: string | null
}

interface Class {
  id: string
  name: string
  description: string | null
  teacher: Teacher
  _count: {
    enrollments: number
    exams: number
  }
  students: Student[]
  exams: Exam[]
}

interface ClassResponse {
  success: boolean
  data: Class | null
  error?: string
}

export default function ClassPage() {
  const router = useRouter()
  const params = useParams<{ classId: string }>()

  const { data: response, isLoading } = useQuery<ClassResponse>({
    queryKey: ['class', params.classId],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/classes/${params.classId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch class')
      }
      return res.json()
    },
  })

  if (isLoading) {
    return <LoadingPageSkeleton />
  }

  if (!response?.success || !response.data) {
    return (
      <TeacherDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-2">Class Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The class you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/teacher/classes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
        </div>
      </TeacherDashboardLayout>
    )
  }

  const classData = response.data

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
                <p className="text-muted-foreground">{classData.description}</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/teacher/classes/${params.classId}/students/invite`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Invite Students
            </Button>
            <Button onClick={() => router.push(`/teacher/classes/${params.classId}/exams/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classData._count.enrollments}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classData.exams?.filter((exam) => exam.status === 'ACTIVE').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classData.exams?.length || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          <TabsContent value="exams" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classData.exams?.map((exam) => (
                <Card
                  key={exam.id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={
                          exam.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : exam.status === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800'
                            : exam.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {exam.status.charAt(0) + exam.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription>{exam.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))}
              {(!classData.exams || classData.exams.length === 0) && (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-lg font-semibold">No Exams Yet</h3>
                  <p className="text-muted-foreground mt-2">
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
              )}
            </div>
          </TabsContent>
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>
                  Manage students enrolled in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classData.students?.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                  {(!classData.students || classData.students.length === 0) && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold">No Students Enrolled</h3>
                      <p className="text-muted-foreground mt-2">
                        Invite students to join your class
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push(`/teacher/classes/${params.classId}/students/invite`)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Invite Students
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherDashboardLayout>
  )
}
