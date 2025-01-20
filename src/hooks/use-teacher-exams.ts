import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { Exam } from '@prisma/client'

interface ExamWithDetails extends Exam {
  class: {
    id: string
    name: string
    code: string
  }
  questions: {
    id: number
    type: string
    points: number
  }[]
  _count: {
    submissions: number
  }
}

export function useTeacherExams() {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const { data: exams = [], isLoading, error } = useQuery<ExamWithDetails[]>({
    queryKey: ['teacher-exams'],
    queryFn: async () => {
      const response = await axios.get('/api/teacher/exams')
      return response.data
    },
  })

  const deleteExam = useMutation({
    mutationFn: async (examId: string) => {
      setIsDeleting(examId)
      await axios.delete('/api/teacher/exams', { data: { examId } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-exams'] })
      toast.success('Exam deleted successfully')
      setIsDeleting(null)
    },
    onError: (error) => {
      console.error('Failed to delete exam:', error)
      toast.error('Failed to delete exam')
      setIsDeleting(null)
    },
  })

  return {
    exams,
    isLoading,
    error,
    deleteExam: deleteExam.mutate,
    isDeleting,
  }
} 