'use client'

import { useQuery } from '@tanstack/react-query'
import { Bell, Lock, Eye, Moon, Sun, Laptop } from 'lucide-react'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from 'next-themes'

interface Settings {
  notifications: {
    email: boolean
    push: boolean
    examReminders: boolean
    classUpdates: boolean
    announcements: boolean
  }
  privacy: {
    showProfile: boolean
    showActivity: boolean
    showProgress: boolean
  }
  preferences: {
    language: string
    timezone: string
  }
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { data: settings, isLoading, refetch } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const handleUpdateSettings = async (
    category: keyof Settings,
    setting: string,
    value: boolean
  ) => {
    try {
      const response = await fetch('/api/teacher/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          setting,
          value,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      await refetch()
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      })
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <TeacherDashboardLayout>
        <div className="space-y-6 animate-in fade-in-50">
          <div className="flex flex-col space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </TeacherDashboardLayout>
    )
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings?.notifications.email}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', 'email', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={settings?.notifications.push}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', 'push', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="exam-reminders">Exam Reminders</Label>
                <Switch
                  id="exam-reminders"
                  checked={settings?.notifications.examReminders}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', 'examReminders', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="class-updates">Class Updates</Label>
                <Switch
                  id="class-updates"
                  checked={settings?.notifications.classUpdates}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', 'classUpdates', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="announcements">Announcements</Label>
                <Switch
                  id="announcements"
                  checked={settings?.notifications.announcements}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', 'announcements', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <CardTitle>Privacy</CardTitle>
              </div>
              <CardDescription>
                Control what others can see about you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-profile">Show Profile</Label>
                <Switch
                  id="show-profile"
                  checked={settings?.privacy.showProfile}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('privacy', 'showProfile', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-activity">Show Activity</Label>
                <Switch
                  id="show-activity"
                  checked={settings?.privacy.showActivity}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('privacy', 'showActivity', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-progress">Show Progress</Label>
                <Switch
                  id="show-progress"
                  checked={settings?.privacy.showProgress}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('privacy', 'showProgress', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setTheme('system')}
                  >
                    <Laptop className="mr-2 h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full">
                Active Sessions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherDashboardLayout>
  )
} 