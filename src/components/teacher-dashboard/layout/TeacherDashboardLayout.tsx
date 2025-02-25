'use client'

import { ReactNode } from 'react'
import {
  BarChart,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
  HelpCircle,
  LogOut,
  UserCircle,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut, useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TeacherDashboardLayoutProps {
  children: ReactNode
}

interface SidebarItem {
  title: string
  href: string
  icon: any
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/teacher/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Calendar',
        href: '/teacher/calendar',
        icon: Calendar,
      },
      {
        title: 'Reports',
        href: '/teacher/reports',
        icon: BarChart,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Classes',
        href: '/teacher/classes',
        icon: GraduationCap,
      },
      {
        title: 'Exams',
        href: '/teacher/exams',
        icon: FileText,
      },
      {
        title: 'Students',
        href: '/teacher/students',
        icon: Users,
      },
      {
        title: 'Resources',
        href: '/teacher/resources',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'Settings & Support',
    items: [
      {
        title: 'Profile',
        href: '/teacher/profile',
        icon: UserCircle,
      },
      {
        title: 'Notifications',
        href: '/teacher/notifications',
        icon: Bell,
      },
      {
        title: 'Settings',
        href: '/teacher/settings',
        icon: Settings,
      },
      {
        title: 'Get Help',
        href: '/teacher/help',
        icon: HelpCircle,
      },
    ],
  },
]

export default function TeacherDashboardLayout({
  children,
}: TeacherDashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  if (!session?.user?.email) {
    return null
  }

  const userInitials = session.user.email!
    .split('@')[0]
    .split('.')
    .map((n: string) => n[0].toUpperCase())
    .join('')

  const userDisplayName = session.user.email!
    .split('@')[0]
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/'
      })
    } catch (error) {
      console.error('Error signing out:', error)
      router.push('/')
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 z-50 flex h-full w-72 flex-col border-r">
        <div className="border-b px-6 py-4">
          <Link
            href="/teacher/dashboard"
            className="flex items-center space-x-2"
          >
            <GraduationCap className="h-6 w-6" />
            <span className="text-lg font-bold">Teacher Portal</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {sidebarSections.map((section, index) => (
            <div key={section.title} className="px-4 py-2">
              <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.title}
                    </Link>
                  )
                })}
              </div>
              {index < sidebarSections.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <Avatar>
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userDisplayName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/teacher/profile')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/teacher/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {userDisplayName}
                </span>
                <span className="text-md text-muted-foreground">Teacher</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto pl-72">
        <div className="container mx-auto max-w-7xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
