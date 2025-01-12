'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Search, UserPlus, UserX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  enrolledAt: string
}

interface StudentsListProps {
  classId: string
}

export function StudentsList({ classId }: StudentsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')
  const queryClient = useQueryClient()

  // Fetch enrolled students
  const { data: students, isLoading } = useQuery<{ data: Student[] }>({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/students`)
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }
      return response.json()
    },
  })

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/teacher/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add student')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] })
      setShowAddDialog(false)
      setStudentEmail('')
      toast({
        title: 'Student added successfully',
        description: 'The student has been enrolled in the class.',
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

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/teacher/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove student')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] })
      toast({
        title: 'Student removed successfully',
        description: 'The student has been removed from the class.',
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a student email',
        variant: 'destructive',
      })
      return
    }
    addStudentMutation.mutate(studentEmail.trim())
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (confirm('Are you sure you want to remove this student from the class?')) {
      removeStudentMutation.mutate(studentId)
    }
  }

  const filteredStudents = students?.data.filter(student => {
    const searchLower = searchQuery.toLowerCase()
    return (
      student.email.toLowerCase().includes(searchLower) ||
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Badge variant="secondary">
            {students?.data.length || 0} students enrolled
          </Badge>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Enrolled On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents?.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  {student.firstName && student.lastName
                    ? `${student.firstName} ${student.lastName}`
                    : 'No name provided'}
                </TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  {new Date(student.enrolledAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={removeStudentMutation.isPending}
                  >
                    {removeStudentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredStudents?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Enter the student's email address to add them to the class.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStudent}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Input
                  id="email"
                  placeholder="student@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  disabled={addStudentMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={addStudentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addStudentMutation.isPending}
              >
                {addStudentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Student'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 