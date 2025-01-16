import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Question {
  id: number
  content: string
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'LONG_ANSWER'
  points: number
  options?: Array<{ text: string }>
  timeLimit?: number
}

interface ExamMetadata {
  title: string
  description?: string
  duration: number
  classId: string
}

interface SecuritySettings {
  blockClipboard: boolean
  blockKeyboardShortcuts: boolean
  blockMultipleTabs: boolean
  blockRightClick: boolean
  blockSearchEngines: boolean
  browserMonitoring: boolean
  deviceTracking: boolean
  fullScreenMode: boolean
  maxViolations: number
  periodicUserValidation: boolean
  resumeCount: number
  screenshotBlocking: boolean
  webcamRequired: boolean
}

interface ExamCreationStore {
  metadata: ExamMetadata
  questions: Question[]
  securitySettings: SecuritySettings
  nextQuestionId: number
  
  // Actions
  setMetadata: (metadata: Partial<ExamMetadata>) => void
  addQuestion: (question: Omit<Question, 'id'>) => void
  updateQuestion: (id: number, updates: Partial<Question>) => void
  removeQuestion: (id: number) => void
  reorderQuestions: (startIndex: number, endIndex: number) => void
  setSecuritySettings: (settings: Partial<SecuritySettings>) => void
  clearStore: () => void
}

const initialSecuritySettings: SecuritySettings = {
  blockClipboard: false,
  blockKeyboardShortcuts: false,
  blockMultipleTabs: false,
  blockRightClick: false,
  blockSearchEngines: false,
  browserMonitoring: false,
  deviceTracking: false,
  fullScreenMode: false,
  maxViolations: 3,
  periodicUserValidation: false,
  resumeCount: 0,
  screenshotBlocking: false,
  webcamRequired: false,
}

const initialMetadata: ExamMetadata = {
  title: '',
  description: '',
  duration: 60,
  classId: '',
}

export const useExamCreationStore = create<ExamCreationStore>()(
  persist(
    (set) => ({
      metadata: initialMetadata,
      questions: [],
      securitySettings: initialSecuritySettings,
      nextQuestionId: 1,

      setMetadata: (updates) =>
        set((state) => ({
          metadata: { ...state.metadata, ...updates },
        })),

      addQuestion: (question) =>
        set((state) => ({
          questions: [...state.questions, { ...question, id: state.nextQuestionId }],
          nextQuestionId: state.nextQuestionId + 1,
        })),

      updateQuestion: (id, updates) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === id ? { ...q, ...updates } : q
          ),
        })),

      removeQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),

      reorderQuestions: (startIndex, endIndex) =>
        set((state) => {
          const newQuestions = [...state.questions]
          const [removed] = newQuestions.splice(startIndex, 1)
          newQuestions.splice(endIndex, 0, removed)
          return { questions: newQuestions }
        }),

      setSecuritySettings: (updates) =>
        set((state) => ({
          securitySettings: { ...state.securitySettings, ...updates },
        })),

      clearStore: () =>
        set({
          metadata: initialMetadata,
          questions: [],
          securitySettings: initialSecuritySettings,
          nextQuestionId: 1,
        }),
    }),
    {
      name: 'exam-creation-store',
    }
  )
) 