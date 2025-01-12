'use client'

import * as React from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateExamDialog } from './CreateExamDialog'
import { Loader2, Search, Plus, Eye, Settings, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Exam {
  id: string
  title: string
  description: string | null
  duration: number
  startTime: string | null
  endTime: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  createdAt: string
  _count: {
    enrollments: number
    questions: number
    submissions: number
  }
}

interface ExamsListProps {
  classId: string
}

export function ExamsList({ classId }: ExamsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [examToDelete, setExamToDelete] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams`)
      if (!response.ok) {
        throw new Error('Failed to fetch exams')
      }
      const data = await response.json()
      return data.data as Exam[]
    },
  })

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams/${examId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete exam')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', classId] })
      toast({
        title: 'Success',
        description: 'Exam deleted successfully',
      })
      setExamToDelete(null)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete exam',
        variant: 'destructive',
      })
    },
  })

  const filteredExams = exams?.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: Exam['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'PUBLISHED':
        return 'bg-blue-100 text-blue-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
        </div>
        <CreateExamDialog
          classId={classId}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          }
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExams?.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell className="font-medium">{exam.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(exam.status)}>
                    {exam.status}
                  </Badge>
                </TableCell>
                <TableCell>{exam._count.questions}</TableCell>
                <TableCell>{exam._count.submissions}</TableCell>
                <TableCell>
                  {new Date(exam.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Questions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Exam
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setExamToDelete(exam.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredExams?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No exams found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the exam
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => examToDelete && deleteExamMutation.mutate(examToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteExamMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 