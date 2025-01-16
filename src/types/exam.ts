import { QuestionType, DifficultyLevel, ExamStatus, SecurityLevel } from '@prisma/client'

// Base question interface
export interface BaseQuestion {
  id?: string
  type: QuestionType
  content: string
  points: number
  difficulty: DifficultyLevel
  explanation?: string | null
  timeLimit?: number | null
  orderIndex: number
}

// Multiple choice question
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'MULTIPLE_CHOICE'
  options: {
    text: string
    isCorrect: boolean
    explanation?: string | null
  }[]
}

// Short answer question
export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'SHORT_ANSWER'
  correctAnswer: string
}

// Long answer question
export interface LongAnswerQuestion extends BaseQuestion {
  type: 'LONG_ANSWER'
  rubric?: string | null
}

// True/False question
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'TRUE_FALSE'
  correctAnswer: 'true' | 'false'
}

// Matching question
export interface MatchingQuestion extends BaseQuestion {
  type: 'MATCHING'
  matchingPairs: {
    left: string
    right: string
  }[]
}

// Coding question
export interface CodingQuestion extends BaseQuestion {
  type: 'CODING'
  programmingLanguage: string
  codeTemplate?: string | null
  testCases: {
    input: string
    expectedOutput: string
    isHidden: boolean
    explanation?: string | null
  }[]
}

// Union type for all question types
export type Question = 
  | MultipleChoiceQuestion 
  | ShortAnswerQuestion 
  | LongAnswerQuestion 
  | TrueFalseQuestion 
  | MatchingQuestion 
  | CodingQuestion

// Form values for creating/editing an exam
export interface ExamFormValues {
  title: string
  description?: string
  duration: number
  startTime: Date | null
  endTime: Date | null
  classId?: string
  questions?: Question[]
  securityLevel?: SecurityLevel
  maxViolations?: number
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

// API response interfaces
export interface ExamResponse {
  success: boolean
  data?: Partial<ExamWithDetails> | ExamWithDetails
  error?: string
}

export interface ExamListResponse {
  success: boolean
  data?: ExamWithDetails[]
  total?: number
  error?: string
}

export interface ExamWithDetails {
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
    questions: number
  }
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

// Question form values type
export type QuestionFormValues = {
  type: QuestionType
  content: string
  points: number
  difficulty: DifficultyLevel
  explanation?: string
  timeLimit?: number | null
} & (
  | {
      type: 'MULTIPLE_CHOICE'
      options: {
        text: string
        isCorrect: boolean
        explanation?: string
      }[]
    }
  | {
      type: 'SHORT_ANSWER'
      correctAnswer: string
    }
  | {
      type: 'LONG_ANSWER'
      rubric?: string
    }
  | {
      type: 'TRUE_FALSE'
      correctAnswer: 'true' | 'false'
    }
  | {
      type: 'MATCHING'
      matchingPairs: {
        left: string
        right: string
      }[]
    }
  | {
      type: 'CODING'
      programmingLanguage: string
      codeTemplate?: string
      testCases: {
        input: string
        expectedOutput: string
        isHidden: boolean
        explanation?: string
      }[]
    }
)
