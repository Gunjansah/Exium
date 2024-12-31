'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import TodoList from '@/components/dashboard/TodoList'
import SearchBar from '@/components/dashboard/SearchBar'
import UpcomingExams from '@/components/dashboard/UpcomingExams'
import HomeworkProgress from '@/components/dashboard/HomeworkProgress'
import DocumentsList from '@/components/dashboard/DocumentsList'
import TeachersFeedback from '@/components/dashboard/TeachersFeedback'
import { 
  BookOpen, 
  FileText, 
  Settings, 
  HelpCircle, 
  User,
  BarChart2,
  Bell,
  LogOut,
  Calendar as CalendarIcon,
  PlusCircle
} from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)

  useEffect(() => {
    if (session?.user) {
      // Fetch user details
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => setUserDetails(data))
        .catch(err => console.error('Error fetching user details:', err))
    }
  }, [session])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/teacher_dashboard')
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

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  const displayName = userDetails 
    ? `${userDetails.firstName} ${userDetails.lastName}`.trim() || userDetails.email.split('@')[0]
    : session.user.email.split('@')[0]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="w-72 backdrop-blur-xl bg-white/80 border-r border-gray-200/50 p-8 shadow-lg">
        <div className="mb-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-white/50 shadow-lg">
              {userDetails?.profileImage ? (
                <Image
                  src={userDetails.profileImage}
                  alt="Profile"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-7 h-7 text-white m-auto mt-3.5" />
              )}
            </div>
            <div>
              <h2 className="font-medium text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">ProjectZ</h1>
        </div>

        <nav className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-4">General</h2>
            <div className="space-y-1">
              <Link href="/student_dashboard" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <BookOpen className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">Dashboard</span>
              </Link>
              <Link href="/student_dashboard/enroll" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <PlusCircle className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">Enroll in Class</span>
              </Link>
              <Link href="#" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <FileText className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">Documents</span>
              </Link>
              <Link href="/student_dashboard/calendar" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <CalendarIcon className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">Calendar</span>
              </Link>
              <Link href="/student_dashboard/analytics" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <BarChart2 className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">Analytics</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 font-medium ml-4">Settings</h2>
            <div className="space-y-1">
              <Link href="/student_dashboard/settings" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <Settings className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">General Settings</span>
              </Link>
              <Link href="/student_dashboard/help" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <HelpCircle className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">Get Help</span>
              </Link>
              <Link href="/student_dashboard/profile" 
                className="flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 group">
                <User className="w-5 h-5 mr-3 group-hover:text-blue-600 text-gray-400" />
                <span className="text-gray-700 group-hover:text-blue-600">Profile Settings</span>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center backdrop-blur-xl bg-white/80 p-6 rounded-2xl shadow-sm border border-gray-200/50">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}</h1>
              <p className="text-gray-500 mt-1">Track your progress and upcoming exams</p>
            </div>
            <div className="flex items-center space-x-6">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              </button>
              <SearchBar />
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="col-span-2 space-y-8">
              {/* Progress Section */}
              <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-sm border border-gray-200/50 p-8 transition-all duration-300 hover:shadow-md">
                <HomeworkProgress />
              </div>

              {/* Schedule Section */}
              <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-sm border border-gray-200/50 p-8 transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Exams</h2>
                  <a href="#" className="text-blue-600 text-sm hover:text-blue-700 transition-colors duration-200">View all</a>
                </div>
                <UpcomingExams />
              </div>

              {/* Documents Section */}
              <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-sm border border-gray-200/50 p-8 transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
                  <a href="#" className="text-blue-600 text-sm hover:text-blue-700 transition-colors duration-200">View all</a>
                </div>
                <DocumentsList />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Todo List Widget */}
              <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-sm border border-gray-200/50 p-8 transition-all duration-300 hover:shadow-md">
                <TodoList />
              </div>

              {/* Teacher's Feedback */}
              <div className="backdrop-blur-xl bg-white/80 rounded-2xl shadow-sm border border-gray-200/50 p-8 transition-all duration-300 hover:shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Teacher Feedback</h2>
                  <a href="#" className="text-blue-600 text-sm hover:text-blue-700 transition-colors duration-200">View all</a>
                </div>
                <TeachersFeedback />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 