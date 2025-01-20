import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SecurityLevel } from '@prisma/client'
import type { ExamFormValues } from '@/types/exam'

interface ExamMetadata {
  title: string
  description?: string
  duration: number
  classId: string
  startTime?: Date | null
  endTime?: Date | null
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

interface StoreQuestion {
  id: string
  content: string
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'TRUE_FALSE' | 'MATCHING' | 'CODING'
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  orderIndex: number
  timeLimit?: number | null
  explanation?: string | null
  options?: Array<{
    text: string
    isCorrect: boolean
    explanation?: string | null
  }>
}

interface ExamCreationStore {
  metadata: ExamMetadata
  questions: StoreQuestion[]
  securitySettings: SecuritySettings
  nextQuestionId: number
  isSubmitting: boolean
  
  // Actions
  setMetadata: (metadata: Partial<ExamMetadata>) => void
  addQuestion: (question: Omit<StoreQuestion, 'id' | 'orderIndex' | 'difficulty'>) => void
  updateQuestion: (id: number, updates: Partial<Omit<StoreQuestion, 'id' | 'orderIndex'>>) => void
  removeQuestion: (id: number) => void
  reorderQuestions: (startIndex: number, endIndex: number) => void
  setSecuritySettings: (settings: Partial<SecuritySettings>) => void
  clearStore: () => void
  submitExam: () => Promise<void>
}

const initialSecuritySettings: SecuritySettings = {
  blockClipboard: true,
  blockKeyboardShortcuts: true,
  blockMultipleTabs: true,
  blockRightClick: true,
  blockSearchEngines: true,
  browserMonitoring: true,
  deviceTracking: true,
  fullScreenMode: true,
  maxViolations: 3,
  periodicUserValidation: true,
  resumeCount: 1,
  screenshotBlocking: true,
  webcamRequired: false,
}

export const useExamCreationStore = create<ExamCreationStore>()(
  persist(
    (set, get) => ({
      metadata: {
        title: '',
        description: '',
        duration: 60,
        classId: '',
        startTime: null,
        endTime: null,
      },
      questions: [],
      securitySettings: initialSecuritySettings,
      nextQuestionId: 1,
      isSubmitting: false,

      setMetadata: (metadata) =>
        set((state) => ({
          metadata: { ...state.metadata, ...metadata },
        })),

      addQuestion: (question) =>
        set((state) => ({
          questions: [
            ...state.questions,
            {
              ...question,
              id: String(state.nextQuestionId),
              orderIndex: state.questions.length,
              difficulty: 'MEDIUM',
            },
          ],
          nextQuestionId: state.nextQuestionId + 1,
        })),

      updateQuestion: (id, updates) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === String(id) ? { ...q, ...updates } : q
          ),
        })),

      removeQuestion: (id) =>
        set((state) => ({
          questions: state.questions
            .filter((q) => q.id !== String(id))
            .map((q, index) => ({ ...q, orderIndex: index })),
        })),

      reorderQuestions: (startIndex, endIndex) =>
        set((state) => {
          const newQuestions = [...state.questions]
          const [removed] = newQuestions.splice(startIndex, 1)
          newQuestions.splice(endIndex, 0, removed)
          return {
            questions: newQuestions.map((q, index) => ({
              ...q,
              orderIndex: index,
            })),
          }
        }),

      setSecuritySettings: (settings) =>
        set((state) => ({
          securitySettings: { ...state.securitySettings, ...settings },
        })),

      clearStore: () =>
        set({
          metadata: {
            title: '',
            description: '',
            duration: 60,
            classId: '',
            startTime: null,
            endTime: null,
          },
          questions: [],
          securitySettings: initialSecuritySettings,
          nextQuestionId: 1,
          isSubmitting: false,
        }),

      submitExam: async () => {
        const state = get()
        set({ isSubmitting: true })

        try {
          // Validate required fields
          if (!state.metadata.title || !state.metadata.duration || !state.metadata.classId) {
            throw new Error('Missing required fields')
          }

          if (state.questions.length === 0) {
            throw new Error('At least one question is required')
          }

          // Submit exam through API
          const response = await fetch('/api/teacher/exams', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...state.metadata,
              ...state.securitySettings,
              questions: state.questions,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create exam')
          }

          // Clear store after successful creation
          get().clearStore()
        } catch (error) {
          console.error('Failed to create exam:', error)
          throw error
        } finally {
          set({ isSubmitting: false })
        }
      },
    }),
    {
      name: 'exam-creation-store',
    }
  )
) 