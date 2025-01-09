'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, GraduationCap, FileText, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LoadingPageSkeleton } from '@/components/loading'
import { Overview } from '@/components/student-dashboard/Overview'
import { RecentActivity } from '@/components/student-dashboard/RecentActivity'
import { UpcomingEvents } from '@/components/student-dashboard/UpcomingEvents'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'

interface DashboardStats {
  totalClasses: number
  activeExams: number
  upcomingExams: number
  completedExams: number
  recentActivity: Array<{
    id: string
    type: 'exam_started' | 'exam_completed' | 'class_joined' | 'feedback_received'
    message: string
    timestamp: string
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    type: 'EXAM' | 'DEADLINE' | 'CLASS'
    startTime: string
    endTime?: string
  }>
}

export default function StudentDashboardPage() {
  const router = useRouter()
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const response = await fetch('/api/student/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      return data
    },
    staleTime: 30000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
  })

  if (isLoading) {
    return (
      <StudentDashboardLayout>
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-96 bg-muted rounded mt-2 animate-pulse" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-7">
            <div className="md:col-span-4 h-[400px] rounded-lg border bg-card animate-pulse" />
            <div className="md:col-span-3 h-[400px] rounded-lg border bg-card animate-pulse" />
          </div>

          <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
        </div>
      </StudentDashboardLayout>
    )
  }

  return (
    <StudentDashboardLayout>
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
              onClick={() => router.push('/student/exams')}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              View All Exams
            </Button>
            <Button onClick={() => router.push('/student/classes')}>
              <Plus className="mr-2 h-4 w-4" />
              Join Class
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently enrolled
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
              <CardTitle className="text-sm font-medium">Completed Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedExams || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total exams taken
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
    </StudentDashboardLayout>
  )
} 