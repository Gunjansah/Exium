import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ClassListResponse,
  ClassResponse,
  CreateClassRequest,
  UpdateClassRequest,
} from '@/types/class'

// Fetch all classes
export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/classes')
      const json = (await response.json()) as ClassListResponse

      if (!json.success) {
        throw new Error(json.error)
      }

      return json.data
    },
  })
}

// Fetch single class
export function useClass(classId: string) {
  return useQuery({
    queryKey: ['classes', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}`)
      const json = (await response.json()) as ClassResponse

      if (!json.success) {
        throw new Error(json.error)
      }

      return json.data
    },
    enabled: !!classId,
  })
}

// Create class
export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateClassRequest) => {
      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const json = (await response.json()) as ClassResponse

      if (!json.success) {
        throw new Error(json.error)
      }

      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

// Update class
export function useUpdateClass(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateClassRequest) => {
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const json = (await response.json()) as ClassResponse

      if (!json.success) {
        throw new Error(json.error)
      }

      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['classes', classId] })
    },
  })
}

// Delete class
export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (classId: string) => {
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const json = await response.json()
        throw new Error(json.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

// Fetch class members
export function useClassMembers(classId: string) {
  return useQuery({
    queryKey: ['classes', classId, 'members'],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/members`)
      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error)
      }

      return json.data
    },
    enabled: !!classId,
  })
}

// Add class member
export function useAddClassMember(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      role = 'STUDENT',
    }: {
      email: string
      role?: 'STUDENT' | 'TEACHER'
    }) => {
      const response = await fetch(`/api/teacher/classes/${classId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error)
      }

      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['classes', classId, 'members'],
      })
    },
  })
}

// Remove class member
export function useRemoveClassMember(classId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(
        `/api/teacher/classes/${classId}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const json = await response.json()
        throw new Error(json.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['classes', classId, 'members'],
      })
    },
  })
}
