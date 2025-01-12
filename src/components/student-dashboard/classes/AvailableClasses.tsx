'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Users, BookOpen, School } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AvailableClass {
  id: string
  name: string
  description: string | null
  code: string
  teacher: {
    firstName: string | null
    lastName: string | null
  }
  _count: {
    enrollments: number
    exams: number
  }
}

export function AvailableClasses() {
  const [selectedClass, setSelectedClass] = useState<AvailableClass | null>(null)
  const [classCode, setClassCode] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: classes, isLoading } = useQuery<{ data: AvailableClass[] }>({
    queryKey: ['available-classes'],
    queryFn: async () => {
      const response = await fetch('/api/student/classes/available')
      if (!response.ok) {
        throw new Error('Failed to fetch available classes')
      }
      return response.json()
    },
  })

  const enrollMutation = useMutation({
    mutationFn: async (classCode: string) => {
      const response = await fetch('/api/student/classes/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classCode }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to enroll in class')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsDialogOpen(false)
      setClassCode('')
      setSelectedClass(null)
      queryClient.invalidateQueries({ queryKey: ['available-classes'] })
      toast({
        title: 'Enrollment Request Submitted',
        description: 'Your request has been sent to the teacher for approval. You will be notified once it is processed.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleEnrollment = async (classToEnroll: AvailableClass) => {
    setSelectedClass(classToEnroll)
    setClassCode('')
    setIsDialogOpen(true)
  }

  const handleSubmitCode = async () => {
    if (!classCode) {
      toast({
        title: 'Error',
        description: 'Please enter the class code',
        variant: 'destructive',
      })
      return
    }

    if (selectedClass && classCode !== selectedClass.code) {
      toast({
        title: 'Error',
        description: 'Invalid class code. Please check and try again.',
        variant: 'destructive',
      })
      return
    }

    enrollMutation.mutate(classCode)
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
          </Card>
        ))}
      </div>
    )
  }

  if (!classes?.data?.length) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <School className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">No Classes Available</h3>
            <p className="text-muted-foreground">
              There are no available classes at the moment. Check back later or ask your teacher for a class code.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {classes.data.map((classItem) => (
        <Card key={classItem.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{classItem.name}</span>
              <Badge variant="secondary" className="ml-2">
                {classItem._count.enrollments} enrolled
              </Badge>
            </CardTitle>
            <CardDescription>
              By{' '}
              {classItem.teacher.firstName && classItem.teacher.lastName
                ? `${classItem.teacher.firstName} ${classItem.teacher.lastName}`
                : 'Unknown Teacher'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              {classItem.description || 'No description available'}
            </p>
            <div className="mt-4 flex gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-1 h-4 w-4" />
                <span>{classItem._count.enrollments} students</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="mr-1 h-4 w-4" />
                <span>{classItem._count.exams} exams</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleEnrollment(classItem)}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending && selectedClass?.id === classItem.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                'Enroll'
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              Please enter the class code provided by your teacher to submit your enrollment request.
              Once submitted, the teacher will review and approve your request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Class Code</Label>
              <Input
                id="code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Enter class code"
                disabled={enrollMutation.isPending}
                className="font-mono text-lg tracking-wider"
              />
              <p className="text-sm text-muted-foreground">
                The class code should be provided by your teacher
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setClassCode('')
              }}
              disabled={enrollMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCode}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 