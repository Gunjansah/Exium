'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Analytics {
  overview: {
    totalClasses: number
    attendanceRate: number
    averageScore: number
    completedAssignments: number
    upcomingDeadlines: number
  }
  performanceData: {
    examScores: Array<{
      date: string
      score: number
      subject: string
    }>
    subjectPerformance: Array<{
      subject: string
      score: number
      assignments: number
      attendance: number
    }>
  }
  progressData: {
    courseProgress: Array<{
      course: string
      progress: number
      totalModules: number
      completedModules: number
    }>
    skillProgress: Array<{
      skill: string
      level: number
      progress: number
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/student/analytics')
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        const data = await response.json()
        setAnalytics(data)
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <div className="text-center text-red-600">
              <p>Error loading analytics: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/student_dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">Track your academic performance and progress</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Overall Progress</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{analytics.overview.averageScore}%</p>
              <p className="ml-2 text-sm text-gray-500">average score</p>
            </div>
            <Progress value={analytics.overview.averageScore} className="mt-3" />
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Completed Assignments</h3>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900">{analytics.overview.completedAssignments}</p>
              <p className="text-sm text-gray-500 mt-1">out of {analytics.performanceData.subjectPerformance.reduce((acc, curr) => acc + curr.assignments, 0)}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Upcoming Deadlines</h3>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900">{analytics.overview.upcomingDeadlines}</p>
              <p className="text-sm text-gray-500 mt-1">in next 7 days</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Courses</h3>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalClasses}</p>
              <p className="text-sm text-gray-500 mt-1">{analytics.overview.attendanceRate}% attendance</p>
            </div>
          </Card>
        </div>

        {/* Performance Trend */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Performance Trend</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.performanceData.examScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Detailed Analytics */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
            <TabsTrigger value="progress">Course Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.performanceData.subjectPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#0088FE" name="Score" />
                      <Bar dataKey="attendance" fill="#00C49F" name="Attendance" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Skill Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.progressData.skillProgress}
                        dataKey="level"
                        nameKey="skill"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {analytics.progressData.skillProgress.map((entry, index) => (
                          <Cell key={entry.skill} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <div className="space-y-6">
              {analytics.progressData.courseProgress.map((course) => (
                <Card key={course.course} className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{course.course}</h3>
                      <p className="text-sm text-gray-500">
                        {course.completedModules} of {course.totalModules} modules completed
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-blue-600">{course.progress}%</p>
                  </div>
                  <Progress value={course.progress} />
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 