'use client'

import { useQuery } from '@tanstack/react-query'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, BarChart } from '@/components/ui/charts'

interface ProgressStats {
  examScores: Array<{
    examId: string
    examTitle: string
    score: number
    totalMarks: number
    date: string
  }>
  classPerformance: Array<{
    classId: string
    className: string
    averageScore: number
    attendanceRate: number
    completionRate: number
  }>
  overallProgress: {
    averageScore: number
    completedExams: number
    totalExams: number
    attendanceRate: number
    ranking: number
    totalStudents: number
  }
}

export default function ProgressPage() {
  const { data: stats, isLoading } = useQuery<ProgressStats>({
    queryKey: ['studentProgress'],
    queryFn: async () => {
      const response = await fetch('/api/student/progress')
      if (!response.ok) {
        throw new Error('Failed to fetch progress data')
      }
      return response.json()
    },
    staleTime: 60000, // Data stays fresh for 1 minute
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return (
      <StudentDashboardLayout>
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex flex-col space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
          <div className="h-[400px] rounded-lg border bg-card animate-pulse" />
        </div>
      </StudentDashboardLayout>
    )
  }

  const examScoresData = {
    labels: stats?.examScores.map(score => score.examTitle) || [],
    datasets: [
      {
        label: 'Your Score',
        data: stats?.examScores.map(score => (score.score / score.totalMarks) * 100) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  }

  const classPerformanceData = {
    labels: stats?.classPerformance.map(perf => perf.className) || [],
    datasets: [
      {
        label: 'Average Score',
        data: stats?.classPerformance.map(perf => perf.averageScore) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Attendance Rate',
        data: stats?.classPerformance.map(perf => perf.attendanceRate) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Overview</h1>
          <p className="text-muted-foreground">
            Track your academic performance and progress
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.overallProgress.averageScore.toFixed(1)}%
              </div>
              <Progress 
                value={stats?.overallProgress.averageScore} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Class Rank: {stats?.overallProgress.ranking} of {stats?.overallProgress.totalStudents}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exam Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.overallProgress.completedExams} / {stats?.overallProgress.totalExams}
              </div>
              <Progress 
                value={(stats?.overallProgress.completedExams || 0) / (stats?.overallProgress.totalExams || 1) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Exams completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.overallProgress.attendanceRate.toFixed(1)}%
              </div>
              <Progress 
                value={stats?.overallProgress.attendanceRate} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Overall attendance rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exams">Exam Performance</TabsTrigger>
            <TabsTrigger value="classes">Class Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="exams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam Scores Timeline</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <LineChart data={examScoresData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Class Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart data={classPerformanceData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentDashboardLayout>
  )
} 