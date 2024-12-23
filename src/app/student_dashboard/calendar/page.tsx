'use client'

import { useState } from 'react'
import Calendar from '@/components/dashboard/Calendar'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function CalendarPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/student_dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">View and manage your schedule</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {}}
              className="text-sm"
            >
              Today
            </Button>
            <Button 
              variant="outline"
              onClick={() => {}}
              className="text-sm"
            >
              Month View
            </Button>
          </div>
        </div>
        
        {/* Calendar Container */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[calc(100vh-12rem)]">
          <div className="p-6 h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <Calendar className="h-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 