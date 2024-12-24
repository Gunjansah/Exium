'use client'

import { useEffect, useState } from 'react'
import { Clock, Calendar as CalendarIcon, Loader2, AlertTriangle, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Exam {
  id: string
  title: string
  className: string
  classCode: string
  teacher: string
  date: string
  endTime: string | null
  duration: number
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  canStart: boolean
  isLocked: boolean
  violationCount: number
  securityLevel: 'MINIMAL' | 'STANDARD' | 'STRICT'
}

export default function UpcomingExams() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exams, setExams] = useState<Exam[]>([])

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch('/api/student/upcoming-exams')
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to fetch exams')
        }
        const data = await response.json()
        setExams(data)
      } catch (err) {
        console.error('Error fetching exams:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  const handleStartExam = (examId: string) => {
    router.push(`/student_dashboard/exam/disclaimer`)
  }

  const getStatusBadge = (status: Exam['status']) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'ACTIVE':
        return <span className={cn(baseClasses, "bg-green-100 text-green-800")}>Active</span>
      case 'PUBLISHED':
        return <span className={cn(baseClasses, "bg-blue-100 text-blue-800")}>Coming Soon</span>
      case 'COMPLETED':
        return <span className={cn(baseClasses, "bg-gray-100 text-gray-800")}>Completed</span>
      default:
        return null
    }
  }

  const getSecurityBadge = (level: Exam['securityLevel']) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium ml-2"
    switch (level) {
      case 'STRICT':
        return <span className={cn(baseClasses, "bg-red-100 text-red-800")}>Strict Security</span>
      case 'STANDARD':
        return <span className={cn(baseClasses, "bg-yellow-100 text-yellow-800")}>Standard Security</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white/50 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading exams...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-medium">Error loading exams</h3>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50/50 rounded-lg">
        <p className="text-gray-600">No upcoming exams scheduled</p>
        <p className="text-sm text-gray-500 mt-1">Check back later for new exams</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {exams.map(exam => (
        <div
          key={exam.id}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                {getStatusBadge(exam.status)}
                {getSecurityBadge(exam.securityLevel)}
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                {exam.className}• {exam.teacher}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                {exam.date && (
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(exam.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {exam.date ? (
                    <>
                      {new Date(exam.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                      {' '}
                    </>
                  ) : 'Flexible timing'}
                  {exam.duration && `(${exam.duration} min)`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {exam.isLocked ? (
                <div className="flex items-center gap-2 text-red-600">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Locked</span>
                </div>
              ) : (
                <Button
                  onClick={() => handleStartExam(exam.id)}
                  disabled={exam.status === 'PUBLISHED'}
                  variant={exam.status === 'ACTIVE' ? 'default' : 'outline'}
                >
                  {exam.status === 'PUBLISHED' ? 'Not Available' : 'Start Exam'}
                </Button>
              )}
            </div>
          </div>
          {exam.violationCount > 0 && (
            <div className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {exam.violationCount} security violation{exam.violationCount > 1 ? 's' : ''} recorded
            </div>
          )}
        </div>
      ))}
    </div>
  )
}