'use client'

import { useEffect, useState } from 'react'
import { Clock, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Exam {
  id: string
  title: string
  className: string
  date: string
  endTime: string | null
  duration: number
  status: string
  canStart: boolean
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
          throw new Error('Failed to fetch exams')
        }
        const data = await response.json()
        setExams(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  const handleStartExam = (examId: string) => {
    router.push(`/student_dashboard/exam?id=${examId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error loading exams</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        No upcoming exams scheduled
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {exams.map(exam => (
        <div
          key={exam.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{exam.title}</h3>
            <p className="text-sm text-gray-600 mt-0.5">{exam.className}</p>
            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {new Date(exam.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(exam.date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
                {' '}({exam.duration} min)
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleStartExam(exam.id)}
            disabled={!exam.canStart}
            className={`px-4 py-2 rounded-lg transition-colors ${
              exam.canStart
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {exam.canStart ? 'Start Exam' : 'Not Available'}
          </button>
        </div>
      ))}
    </div>
  )
} 