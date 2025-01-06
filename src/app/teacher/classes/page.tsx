'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, FileText } from 'lucide-react'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Class {
  id: string
  name: string
  description: string | null
  teacher: Teacher
  _count: {
    enrollments: number
    exams: number
  }
}

interface ClassesResponse {
  success: boolean
  data: Class[]
}

export default function ClassesPage() {
  const router = useRouter()

  const { data: response, isLoading } = useQuery<ClassesResponse>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await fetch('/api/teacher/classes')
      if (!res.ok) {
        throw new Error('Failed to fetch classes')
      }
      return res.json()
    },
  })

  if (isLoading) {
    return <LoadingPageSkeleton />
  }

  const classes = response?.data || []

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground">
              Manage your classes and student groups
            </p>
          </div>
          <Button onClick={() => router.push('/teacher/classes/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Class
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card
              key={classItem.id}
              className="cursor-pointer hover:bg-accent/5"
              onClick={() => router.push(`/teacher/classes/${classItem.id}`)}
            >
              <CardHeader>
                <CardTitle>{classItem.name}</CardTitle>
                <CardDescription>{classItem.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {classItem._count.enrollments} Students
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {classItem._count.exams} Active Exams
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-semibold">No Classes Yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first class to get started
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push('/teacher/classes/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </div>
          )}
        </div>
      </div>
    </TeacherDashboardLayout>
  )
}
