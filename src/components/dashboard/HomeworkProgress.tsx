'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CourseProgress {
  id: string
  name: string
  progress: number
  icon: string
}

interface ProgressStats {
  overallProgress: number
  completedAssignments: number
  upcomingDeadlines: number
}

interface ProgressData {
  courses: CourseProgress[]
  stats: ProgressStats
}

export default function HomeworkProgress() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<ProgressData | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/student/course-progress')
        if (!response.ok) {
          throw new Error('Failed to fetch progress data')
        }
        const data = await response.json()
        setProgressData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error loading progress data</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!progressData) {
    return (
      <div className="text-center text-gray-600 p-4">
        No progress data available
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Course Progress</h2>
        <div className="text-sm text-gray-500">
          Overall: {progressData.stats.overallProgress}%
        </div>
      </div>

      <div className="space-y-4">
        {progressData.courses.map(course => (
          <div key={course.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span>{course.icon}</span>
                <span className="font-medium">{course.name}</span>
              </div>
              <span className="text-sm text-gray-600">{course.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {progressData.stats.completedAssignments}
          </div>
          <div className="text-sm text-gray-600">Assignments Completed</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {progressData.stats.upcomingDeadlines}
          </div>
          <div className="text-sm text-gray-600">Upcoming Deadlines</div>
        </div>
      </div>
    </div>
  )
} 