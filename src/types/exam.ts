import { QuestionType, DifficultyLevel, SecurityLevel, ExamStatus } from '@prisma/client'

export interface TestCase {
  id?: string
  input: string
  expectedOutput: string
  isHidden: boolean
  explanation?: string
}

export interface QuestionOption {
  id?: string
  text: string
  isCorrect: boolean
  explanation?: string
}

export interface MatchingPair {
  id?: string
  left: string
  right: string
}

export interface QuestionBase {
  id?: string
  type: QuestionType
  content: string
  points: number
  difficulty: DifficultyLevel
  explanation?: string
  timeLimit?: number | null
  orderIndex?: number
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'MULTIPLE_CHOICE'
  options: QuestionOption[]
  correctAnswer?: never
  testCases?: never
  codeTemplate?: never
  matchingPairs?: never
}

export interface ShortAnswerQuestion extends QuestionBase {
  type: 'SHORT_ANSWER'
  correctAnswer: string
  options?: never
  testCases?: never
  codeTemplate?: never
  matchingPairs?: never
}

export interface LongAnswerQuestion extends QuestionBase {
  type: 'LONG_ANSWER'
  correctAnswer?: string
  rubric?: string
  options?: never
  testCases?: never
  codeTemplate?: never
  matchingPairs?: never
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'TRUE_FALSE'
  correctAnswer: 'true' | 'false'
  options?: never
  testCases?: never
  codeTemplate?: never
  matchingPairs?: never
}

export interface MatchingQuestion extends QuestionBase {
  type: 'MATCHING'
  matchingPairs: MatchingPair[]
  options?: never
  correctAnswer?: never
  testCases?: never
  codeTemplate?: never
}

export interface CodingQuestion extends QuestionBase {
  type: 'CODING'
  codeTemplate?: string
  testCases: TestCase[]
  options?: never
  correctAnswer?: never
  matchingPairs?: never
  programmingLanguage: string
}

export type Question = 
  | MultipleChoiceQuestion 
  | ShortAnswerQuestion 
  | LongAnswerQuestion 
  | TrueFalseQuestion 
  | MatchingQuestion 
  | CodingQuestion

export interface CreateExamRequest {
  title: string
  description?: string | null
  duration: number
  startTime?: Date | null
  endTime?: Date | null
  classId: string
  questions: Question[]
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

export interface ExamResponse {
  id: string
  title: string
  description?: string | null
  duration: number
  startTime?: Date | null
  endTime?: Date | null
  status: ExamStatus
  createdAt: Date
  updatedAt: Date
  classId: string
  createdBy: string
  questions: Question[]
  securityLevel: SecurityLevel
  maxViolations: number
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
}

export interface ExamListResponse {
  exams: ExamResponse[]
  total: number
}

export interface ExamWithDetails extends ExamResponse {
  class: {
    name: string
  }
  teacher: {
    name: string | null
    email: string
  }
  _count: {
    enrollments: number
    submissions: number
  }
}
