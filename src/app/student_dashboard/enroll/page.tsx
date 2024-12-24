'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search } from 'lucide-react'
import Link from 'next/link'

interface Class {
  id: string
  name: string
  description: string | null
  code: string
  teacher: {
    id: string
    firstName: string | null
    lastName: string | null
  }
  _count: {
    enrollments: number
  }
}

export default function EnrollPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [enrollingClass, setEnrollingClass] = useState<Class | null>(null)
  const [classCode, setClassCode] = useState('')
  const [enrollError, setEnrollError] = useState('')

  useEffect(() => {
    // Redirect if not authenticated or not a student
    if (status === 'unauthenticated') {
      router.push('/signin')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/teacher_dashboard')
      return
    }

    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes/available')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch classes')
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch classes')
        }

        setClasses(data.classes)
      } catch (err) {
        console.error('Error fetching classes:', err)
        setError(err instanceof Error ? err.message : 'Failed to load available classes')
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchClasses()
    }
  }, [status, session, router])

  const handleEnrollClick = (classItem: Class) => {
    setEnrollingClass(classItem)
    setClassCode('')
    setEnrollError('')
  }

  const handleEnrollSubmit = async () => {
    if (!enrollingClass || !session?.user?.id) {
      setEnrollError('You must be logged in to enroll')
      return
    }

    try {
      console.log('Attempting to enroll:', {
        classId: enrollingClass.id,
        code: classCode,
        userId: session.user.id
      })

      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: enrollingClass.id,
          code: classCode
        })
      })

      const data = await response.json()
      console.log('Enrollment response:', data)
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to enroll')
      }

      setClasses(classes.filter(c => c.id !== enrollingClass.id))
      setEnrollingClass(null)
      setClassCode('')
      alert(data.message || 'Successfully enrolled in class!')
    } catch (err) {
      console.error('Enrollment error:', err)
      setEnrollError(err instanceof Error ? err.message : 'Failed to enroll')
    }
  }

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated or not a student
  if (status === 'unauthenticated' || (session?.user?.role !== 'STUDENT')) {
    return null // Router will handle the redirect
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/student_dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Enroll in Classes</h1>
          <p className="text-gray-600 mt-1">Browse and enroll in available classes</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No classes found matching your search criteria
            </div>
          ) : (
            filteredClasses.map(classItem => (
              <div
                key={classItem.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 flex justify-between items-center border border-gray-100"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                    <span className="text-sm text-gray-500">
                      {classItem._count.enrollments} student{classItem._count.enrollments !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{classItem.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Instructor: {classItem.teacher.firstName} {classItem.teacher.lastName}
                  </p>
                </div>
                <button
                  onClick={() => handleEnrollClick(classItem)}
                  className="ml-4 px-4 py-2 rounded-lg transition-all bg-blue-600 text-white hover:bg-blue-700"
                >
                  Enroll
                </button>
              </div>
            ))
          )}
        </div>

        {enrollingClass && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Enroll in {enrollingClass.name}</h2>
              <p className="text-gray-600 mb-4">Please enter the class code to confirm enrollment.</p>
              
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Enter class code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {enrollError && (
                <p className="text-red-600 text-sm mb-4">{enrollError}</p>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEnrollingClass(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnrollSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Enrollment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
