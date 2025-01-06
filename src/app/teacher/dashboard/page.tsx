'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, GraduationCap, Users, FileText, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LoadingPageSkeleton } from '@/components/loading'
import { Overview } from '@/components/teacher-dashboard/Overview'
import { RecentActivity } from '@/components/teacher-dashboard/RecentActivity'
import { UpcomingEvents } from '@/components/teacher-dashboard/UpcomingEvents'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  activeExams: number
  upcomingExams: number
  recentActivity: Array<{
    id: string
    type: 'exam_created' | 'exam_completed' | 'student_joined' | 'feedback_received'
    message: string
    timestamp: string
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    type: 'EXAM' | 'DEADLINE' | 'MEETING'
    startTime: string
    endTime?: string
  }>
}

export default function TeacherDashboardPage() {
  const router = useRouter()
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['teacherDashboard'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return response.json()
    },
  })

  if (isLoading) {
    return <LoadingPageSkeleton />
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening in your classes.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => router.push('/teacher/classes/new')}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Class
            </Button>
            <Button onClick={() => router.push('/teacher/exams/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all your classes
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently teaching
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeExams || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.upcomingExams || 0} upcoming
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.upcomingEvents?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                In the next 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview />
            </CardContent>
          </Card>
          <Card className="md:col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates from your classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity activities={stats?.recentActivity || []} />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Schedule for the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingEvents events={stats?.upcomingEvents || []} />
          </CardContent>
        </Card>
      </div>
    </TeacherDashboardLayout>
  )
}
