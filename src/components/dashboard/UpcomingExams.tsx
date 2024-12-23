'use client'

import { Clock, Calendar as CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Sample data - replace with real data from your backend
const upcomingExams = [
  {
    id: 1,
    title: 'Advanced Algorithms',
    date: '2024-03-15',
    time: '10:00 AM',
    duration: '2 hours',
    status: 'upcoming'
  },
  {
    id: 2,
    title: 'Database Systems',
    date: '2024-03-22',
    time: '2:00 PM',
    duration: '1.5 hours',
    status: 'upcoming'
  },
  {
    id: 3,
    title: 'Web Development',
    date: '2024-03-28',
    time: '11:00 AM',
    duration: '2.5 hours',
    status: 'upcoming'
  }
]

export default function UpcomingExams() {
  const router = useRouter()

  const handleStartExam = (examId: number) => {
    router.push(`/student_dashboard/exam?id=${examId}`)
  }

  return (
    <div className="space-y-4">
      {upcomingExams.map(exam => (
        <div
          key={exam.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{exam.title}</h3>
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
                {exam.time} ({exam.duration})
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleStartExam(exam.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Exam
          </button>
        </div>
      ))}
    </div>
  )
} 