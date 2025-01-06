import { Class, ClassEnrollment, User } from '@prisma/client'

export interface ClassWithDetails extends Class {
  _count: {
    enrollments: number
    exams: number
  }
  teacher: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
}

export interface ClassMember extends ClassEnrollment {
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
}

export interface CreateClassRequest {
  name: string
  description?: string
}

export interface UpdateClassRequest {
  name?: string
  description?: string
}

export type ClassResponse = {
  success: true
  data: ClassWithDetails
} | {
  success: false
  error: string
}

export type ClassListResponse = {
  success: true
  data: ClassWithDetails[]
} | {
  success: false
  error: string
}

export type ClassMembersResponse = {
  success: true
  data: ClassMember[]
} | {
  success: false
  error: string
}
