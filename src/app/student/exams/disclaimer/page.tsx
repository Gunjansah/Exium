'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DisclaimerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('id')

  const handleStartExam = () => {
    if (!examId) {
      router.push('/student/exams')
      return
    }
    router.push(`/student/exams/exam-page?id=${examId}`)
  }

  if (!examId) {
    router.push('/student/exams')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Important Exam Information</h1>
          <p className="text-gray-600">Please read the following instructions carefully before starting the exam.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start">
            <Lock className="w-6 h-6 text-yellow-500 mr-3 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Security Measures</h2>
              <p className="text-gray-600">
                This exam is monitored for academic integrity. The following actions will be recorded:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside ml-4">
                <li>Attempts to exit fullscreen mode</li>
                <li>Switching between tabs or windows</li>
                <li>Copy and paste actions</li>
                <li>Multiple display detection</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start">
            <Clock className="w-6 h-6 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Time Management</h2>
              <p className="text-gray-600">
                The exam has a strict time limit. Once you start:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside ml-4">
                <li>The timer begins immediately</li>
                <li>You cannot pause or stop the timer</li>
                <li>The exam will auto-submit when time expires</li>
                <li>Plan your time wisely for each question</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Important Notes</h2>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside ml-4">
                <li>Ensure stable internet connection</li>
                <li>Use a modern browser (Chrome recommended)</li>
                <li>Close unnecessary applications</li>
                <li>Have required materials ready</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            By clicking "Start Exam", you agree to follow these guidelines and understand that violations may result in disqualification.
          </p>
          <Button
            onClick={handleStartExam}
            className="inline-flex items-center justify-center w-full sm:w-auto"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Start Exam
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
