'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { User, Mail, Phone, Calendar, School, MapPin } from 'lucide-react'
import StudentDashboardLayout from '@/components/student-dashboard/layout/StudentDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

interface Profile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: string
  enrollmentDate: string
  studentId: string
  avatar?: string
  bio?: string
  enrolledClasses: Array<{
    id: string
    name: string
    teacher: {
      name: string
    }
  }>
}

export default function ProfilePage() {
  const { toast } = useToast()
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/student/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    try {
      return format(new Date(dateString), 'PPP')
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
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
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </StudentDashboardLayout>
    )
  }

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            View and manage your profile information
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar} alt={profile?.firstName} />
                  <AvatarFallback>
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile?.firstName} {profile?.lastName}</CardTitle>
                  <CardDescription>Student ID: {profile?.studentId}</CardDescription>
                  <Badge className="mt-2">Active Student</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center space-x-4">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.dateOfBirth && (
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(profile.dateOfBirth)}</span>
                  </div>
                )}
                {profile?.address && (
                  <div className="flex items-center space-x-4">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.address}</span>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <span>Enrolled: {formatDate(profile?.enrollmentDate)}</span>
                </div>
              </div>

              {profile?.bio && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="text-sm font-medium mb-2">About</h4>
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  </div>
                </>
              )}

              <Separator className="my-4" />
              
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrolled Classes</CardTitle>
              <CardDescription>
                Classes you are currently enrolled in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile?.enrolledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h4 className="font-medium">{cls.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Teacher: {cls.teacher.name}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
                {profile?.enrolledClasses.length === 0 && (
                  <div className="text-center py-6">
                    <School className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Classes</h3>
                    <p className="text-sm text-muted-foreground">
                      You are not enrolled in any classes yet.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentDashboardLayout>
  )
} 