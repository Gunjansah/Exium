'use client'

import { MessageCircle } from 'lucide-react'

// Sample data - replace with real data from your backend
const feedbacks = [
  {
    id: 1,
    teacher: {
      name: 'Dr. Sarah Wilson',
      avatar: '👩‍🏫'
    },
    message: 'Great progress on the algorithm complexity analysis. Keep focusing on space complexity concepts.',
    date: '2024-03-10',
    course: 'Advanced Algorithms'
  },
  {
    id: 2,
    teacher: {
      name: 'Prof. James Chen',
      avatar: '👨‍🏫'
    },
    message: 'Your database design is improving. Review the normalization rules for the next assignment.',
    date: '2024-03-09',
    course: 'Database Systems'
  },
  {
    id: 3,
    teacher: {
      name: 'Dr. Emily Brooks',
      avatar: '👩‍🏫'
    },
    message: 'Excellent work on the security implementation. Consider adding input validation.',
    date: '2024-03-08',
    course: 'Web Security'
  }
]

export default function TeachersFeedback() {
  return (
    <div className="space-y-4">
      {feedbacks.map(feedback => (
        <div
          key={feedback.id}
          className="p-4 bg-gray-50 rounded-lg space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{feedback.teacher.avatar}</span>
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {feedback.teacher.name}
                </h4>
                <p className="text-xs text-gray-500">{feedback.course}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(feedback.date).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            <p className="text-sm text-gray-600">{feedback.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
} 