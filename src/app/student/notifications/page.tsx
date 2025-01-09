'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Bell, Calendar, FileText, GraduationCap, Info } from 'lucide-react'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: 'EXAM' | 'CLASS' | 'ANNOUNCEMENT' | 'SYSTEM'
  createdAt: string
  read: boolean
  link?: string
  metadata?: {
    examId?: string
    classId?: string
  }
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const { data: notifications, isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/student/notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return response.json()
    },
    staleTime: 30000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/student/notifications/${id}/read`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      await refetch()
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/student/notifications/read-all', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      await refetch()
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      })
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'EXAM':
        return <FileText className="h-4 w-4" />
      case 'CLASS':
        return <GraduationCap className="h-4 w-4" />
      case 'ANNOUNCEMENT':
        return <Bell className="h-4 w-4" />
      case 'SYSTEM':
        return <Info className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <StudentDashboardLayout>
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex flex-col space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </StudentDashboardLayout>
    )
  }

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your latest activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {notifications?.map((notification) => (
            <Card key={notification.id} className={notification.read ? 'bg-muted/40' : ''}>
              <CardHeader className="flex flex-row items-center space-y-0">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-base">
                      {notification.title}
                    </CardTitle>
                    {!notification.read && (
                      <Badge>New</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {format(new Date(notification.createdAt), 'PPp')}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getNotificationIcon(notification.type)}
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{notification.message}</p>
                {notification.link && (
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0"
                    asChild
                  >
                    <a href={notification.link}>View details</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {notifications?.length === 0 && (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! Check back later for new updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentDashboardLayout>
  )
} 