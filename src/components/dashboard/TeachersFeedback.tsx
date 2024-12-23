'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Teacher {
  name: string
  profileImage: string | null
}

interface Feedback {
  id: string
  message: string
  type: 'GENERAL' | 'EXAM_RELATED' | 'PERFORMANCE' | 'IMPROVEMENT' | 'APPRECIATION'
  createdAt: string
  teacher: Teacher
  class: string
  exam: string | null
  context: string
}

function getFeedbackTypeColor(type: Feedback['type']): string {
  switch (type) {
    case 'EXAM_RELATED':
      return 'bg-blue-100 text-blue-800'
    case 'PERFORMANCE':
      return 'bg-green-100 text-green-800'
    case 'IMPROVEMENT':
      return 'bg-yellow-100 text-yellow-800'
    case 'APPRECIATION':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatFeedbackType(type: Feedback['type']): string {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ')
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  } else {
    return 'Just now'
  }
}

export default function TeachersFeedback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch('/api/student/teacher-feedback')
        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.error || 'Failed to fetch feedback')
        }
        const data = await response.json()
        setFeedback(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching feedback:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [])

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
        <p>Error loading feedback</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <p className="font-medium">No feedback available yet</p>
        <p className="text-sm mt-1">Your teachers' feedback will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:border-gray-200 transition-colors"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {item.teacher.profileImage ? (
                <Image
                  src={item.teacher.profileImage}
                  alt={item.teacher.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {item.teacher.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {item.teacher.name}
                </p>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(item.createdAt)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.context}
              </p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFeedbackTypeColor(item.type)}`}>
                  {formatFeedbackType(item.type)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {item.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 