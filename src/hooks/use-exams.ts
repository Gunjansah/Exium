import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExamListResponse,
  ExamResponse,
  CreateExamRequest,
  UpdateExamRequest,
  ExamWithDetails,
} from '@/types/exam'

// Fetch all exams for a class
export function useClassExams(classId: string) {
  const queryClient = useQueryClient()

  const { data, error, isLoading } = useQuery<ExamWithDetails[], Error>({
    queryKey: ['exams', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams`)
      const json = (await response.json()) as ExamListResponse

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to fetch exams')
      }

      return json.data
    },
  })

  const { mutate: deleteExam } = useMutation<void, Error, string>({
    mutationFn: async (examId: string) => {
      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'DELETE',
      })

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to delete exam')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', classId] })
    },
  })

  return {
    data,
    error,
    isLoading,
    deleteExam,
  }
}

// Fetch single exam
export function useExam(examId: string) {
  return useQuery({
    queryKey: ['exams', examId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/exams/${examId}`)
      const json = (await response.json()) as ExamResponse

      if (!json.success) {
        throw new Error(json.error)
      }

      return json.data
    },
    enabled: !!examId,
  })
}

// Create exam
export function useCreateExam(classId: string) {
  const queryClient = useQueryClient()

  return useMutation<ExamWithDetails, Error, CreateExamRequest>({
    mutationFn: async (data: CreateExamRequest): Promise<ExamWithDetails> => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const json = (await response.json()) as ExamResponse

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to create exam')
      }

      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', classId] })
    },
  })
}

// Update exam
export function useUpdateExam(examId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateExamRequest): Promise<ExamWithDetails> => {
      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update exam')
      }

      const updatedExam = await response.json()
      return updatedExam
    },
    onSuccess: (data: ExamWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ['exams', examId] })
      queryClient.invalidateQueries({
        queryKey: ['exams', { classId: data.classId }],
      })
    },
  })
}

// Delete exam
export function useDeleteExam(examId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/teacher/exams/${examId}`, {
        method: 'DELETE',
      })

      const json = (await response.json()) as ExamResponse

      if (!json.success) {
        throw new Error(json.error)
      }

      if (!json.data) {
        throw new Error('Exam data not found')
      }

      return json.data
    },
    onSuccess: (data: ExamWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ['exams', examId] })
      queryClient.invalidateQueries({
        queryKey: ['exams', { classId: data.classId }],
      })
    },
  })
}
