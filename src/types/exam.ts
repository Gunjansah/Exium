import { User, ExamStatus, SecurityLevel, ViolationType } from '@prisma/client'

export interface Question {
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'TRUE_FALSE' | 'MATCHING' | 'CODING'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  points: number
  content: string
  correctAnswer?: string
  explanation?: string
  timeLimit?: number
  options?: string[]
  codeTemplate?: string
  testCases?: Array<{
    input: string
    expectedOutput: string
    isHidden: boolean
  }>
  orderIndex?: number
}

export interface ExamWithDetails {
  id: string
  title: string
  description: string | null
  duration: number
  startTime: Date | null
  endTime: Date | null
  createdAt: Date
  updatedAt: Date
  createdBy: string
  classId: string
  status: ExamStatus
  // Security Settings
  securityLevel: SecurityLevel
  maxViolations: number
  // Security Features
  fullScreenMode: boolean
  blockMultipleTabs: boolean
  blockKeyboardShortcuts: boolean
  blockRightClick: boolean
  blockClipboard: boolean
  browserMonitoring: boolean
  blockSearchEngines: boolean
  resumeCount: number
  webcamRequired: boolean
  deviceTracking: boolean
  screenshotBlocking: boolean
  periodicUserValidation: boolean
  // Relations
  teacher: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
  _count: {
    questions: number
    enrollments: number
    submissions: number
  }
  questions: Question[]
}

export interface CreateExamRequest {
  title: string
  description?: string | null
  duration: number
  startTime?: Date | null
  endTime?: Date | null
  classId: string
  questions?: Question[]
  // Security Settings
  securityLevel?: SecurityLevel
  maxViolations?: number
  // Security Features
  fullScreenMode?: boolean
  blockMultipleTabs?: boolean
  blockKeyboardShortcuts?: boolean
  blockRightClick?: boolean
  blockClipboard?: boolean
  browserMonitoring?: boolean
  blockSearchEngines?: boolean
  resumeCount?: number
  webcamRequired?: boolean
  deviceTracking?: boolean
  screenshotBlocking?: boolean
  periodicUserValidation?: boolean
}

export interface UpdateExamRequest {
  title?: string
  description?: string | null
  duration?: number
  startTime?: Date | null
  endTime?: Date | null
  status?: ExamStatus
  // Security Settings
  securityLevel?: SecurityLevel
  maxViolations?: number
  // Security Features
  fullScreenMode?: boolean
  blockMultipleTabs?: boolean
  blockKeyboardShortcuts?: boolean
  blockRightClick?: boolean
  blockClipboard?: boolean
  browserMonitoring?: boolean
  blockSearchEngines?: boolean
  resumeCount?: number
  webcamRequired?: boolean
  deviceTracking?: boolean
  screenshotBlocking?: boolean
  periodicUserValidation?: boolean
}

export interface SecurityViolation {
  id: string
  examId: string
  userId: string
  type: ViolationType
  timestamp: Date
  details?: any
}

export interface ExamListResponse {
  success: boolean
  error?: string
  data?: ExamWithDetails[]
}

export interface ExamResponse {
  success: boolean
  error?: string | any
  data?: any
}

export interface ExamSecurityStats {
  totalViolations: number
  violationsByType: Record<ViolationType, number>
  lockedUsers: number
  activeUsers: number
}
