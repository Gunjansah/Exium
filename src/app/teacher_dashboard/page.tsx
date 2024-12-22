'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  FileText, 
  Settings, 
  HelpCircle, 
  User,
  BarChart2,
  Bell,
  Users,
  ClipboardList
} from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'TEACHER') {
      router.push('/student_dashboard')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'TEACHER') {
    return null
  }

  const teacherName = session.user.email.split('@')[0] || 'Teacher'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-600 text-white p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Teacher Portal</h1>
        </div>

        <nav className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm uppercase tracking-wider text-blue-200">Management</h2>
            <div className="space-y-1">
              <a href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <Users className="w-5 h-5 mr-3" />
                Students
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <ClipboardList className="w-5 h-5 mr-3" />
                Exams
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <BarChart2 className="w-5 h-5 mr-3" />
                Analytics
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm uppercase tracking-wider text-blue-200">Settings</h2>
            <div className="space-y-1">
              <a href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <Settings className="w-5 h-5 mr-3" />
                General Settings
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <HelpCircle className="w-5 h-5 mr-3" />
                Get Help
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <User className="w-5 h-5 mr-3" />
                Profile Settings
              </a>
              <LogoutButton />
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {teacherName}</h1>
              <p className="text-gray-600">Manage your classes and exams</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Bell className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Active Exams</h2>
              <div className="text-3xl font-bold text-blue-600">5</div>
              <p className="text-gray-600">Currently in progress</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Total Students</h2>
              <div className="text-3xl font-bold text-green-600">128</div>
              <p className="text-gray-600">Across all classes</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Pending Reviews</h2>
              <div className="text-3xl font-bold text-orange-600">23</div>
              <p className="text-gray-600">Submissions to grade</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 