import { Exam, ExamEnrollment, Submission, User } from '@prisma/client'

export interface DashboardStats {
  activeExams: number
  totalStudents: number
  totalExams: number
  upcomingExams: number
}

export interface RecentActivity {
  id: string
  type: 'EXAM_CREATED' | 'SUBMISSIONS_RECEIVED' | 'EXAM_PUBLISHED' | 'EXAM_GRADED'
  message: string
  timestamp: Date
  meta?: {
    examId?: string
    examTitle?: string
    submissionCount?: number
  }
}

export interface UpcomingExam {
  id: string
  title: string
  scheduledFor: Date
  enrolledCount: number
}

export interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  upcomingExams: UpcomingExam[]
}

// API Response types
export type DashboardResponse = {
  success: true
  data: DashboardData
} | {
  success: false
  error: string
}

// Utility type for exam with enrollment count
export interface ExamWithEnrollmentCount extends Exam {
  _count: {
    enrollments: number
  }
}
