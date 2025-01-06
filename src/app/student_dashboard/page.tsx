'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Calendar from '@/components/dashboard/Calendar'
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
  LogOut
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
      router.push('/teacher/dashboard')
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-600 text-white p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-500">
              {userDetails?.profileImage ? (
                <Image
                  src={userDetails.profileImage}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-6 h-6 text-white m-auto mt-3" />
              )}
            </div>
            <div>
              <h2 className="font-medium text-sm">{displayName}</h2>
              <p className="text-xs text-blue-200">{session.user.email}</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold">My Studies</h1>
        </div>

        <nav className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm uppercase tracking-wider text-blue-200">General</h2>
            <div className="space-y-1">
              <Link href="/student_dashboard" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <BookOpen className="w-5 h-5 mr-3" />
                Dashboard
              </Link>
              <Link href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <FileText className="w-5 h-5 mr-3" />
                Documents
              </Link>
              <Link href="#" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <BarChart2 className="w-5 h-5 mr-3" />
                Analytics
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm uppercase tracking-wider text-blue-200">Settings</h2>
            <div className="space-y-1">
              <Link href="/student_dashboard/settings" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <Settings className="w-5 h-5 mr-3" />
                General Settings
              </Link>
              <Link href="/student_dashboard/help" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <HelpCircle className="w-5 h-5 mr-3" />
                Get Help
              </Link>
              <Link href="/student_dashboard/profile" className="flex items-center px-4 py-2 text-sm rounded-lg hover:bg-blue-700">
                <User className="w-5 h-5 mr-3" />
                Profile Settings
              </Link>
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
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}</h1>
              <p className="text-gray-600">Track your progress and upcoming exams</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Bell className="w-6 h-6 text-gray-600" />
              </button>
              <SearchBar />
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="col-span-2 space-y-8">
              {/* Progress Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <HomeworkProgress />
              </div>

              {/* Schedule Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Upcoming Exams</h2>
                  <a href="#" className="text-blue-600 text-sm hover:underline">View all</a>
                </div>
                <UpcomingExams />
              </div>

              {/* Documents Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recent Documents</h2>
                  <a href="#" className="text-blue-600 text-sm hover:underline">View all</a>
                </div>
                <DocumentsList />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Calendar Widget */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <Calendar />
              </div>

              {/* Teacher's Feedback */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Teacher's Feedback</h2>
                  <a href="#" className="text-blue-600 text-sm hover:underline">View all</a>
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