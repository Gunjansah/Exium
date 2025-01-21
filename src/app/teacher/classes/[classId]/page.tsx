'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { EnrollmentRequests } from '@/components/teacher-dashboard/classes/EnrollmentRequests'
import { StudentsList } from '@/components/teacher-dashboard/classes/StudentsList'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  BarChart3,
  Settings,
  PlusCircle,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ClassDetails {
  id: string
  name: string
  description: string | null
  code: string
  teacher: {
    firstName: string | null
    lastName: string | null
  }
  _count: {
    enrollments: number
    exams: number
  }
}

export default function ClassDetailsPage() {
  const params = useParams()
  const classId = params.classId as string

  const { data: classDetails, isLoading } = useQuery<{ data: ClassDetails }>({
    queryKey: ['class-details', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch class details')
      }
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <TeacherDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </TeacherDashboardLayout>
    )
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-8">
        {/* Class Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{classDetails?.data.name}</h1>
              <p className="text-muted-foreground">
                {classDetails?.data.description || 'No description available'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                Class Code: {classDetails?.data.code}
              </Badge>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classDetails?.data._count.enrollments}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classDetails?.data._count.exams}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="requests">Enrollment Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your class</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Scheduled exams and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <StudentsList classId={classId} />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold tracking-tight">Assignments</h2>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Assignment list will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold tracking-tight">Grades</h2>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Grade book will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold tracking-tight">Enrollment Requests</h2>
            </div>
            <EnrollmentRequests classId={classId} />
          </TabsContent>
        </Tabs>
      </div>
    </TeacherDashboardLayout>
  )
}
