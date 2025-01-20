import * as z from 'zod'
import { SecurityLevel } from '@prisma/client'

export const examFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  startTime: z.date().nullable(),
  endTime: z.date().nullable(),
  classId: z.string(),
  questions: z.array(z.object({
    content: z.string().min(1, 'Question content is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'MATCHING', 'CODING']),
    points: z.number().min(1, 'Points must be at least 1'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    orderIndex: z.number(),
    timeLimit: z.number().min(0).optional(),
    explanation: z.string().nullable().optional(),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean().default(false),
      explanation: z.string().nullable(),
    })).optional(),
  })).min(1, 'At least one question is required'),
  securityLevel: z.nativeEnum(SecurityLevel).default(SecurityLevel.STANDARD),
  maxViolations: z.number().min(1).default(3),
  fullScreenMode: z.boolean().default(true),
  blockMultipleTabs: z.boolean().default(true),
  blockKeyboardShortcuts: z.boolean().default(true),
  blockRightClick: z.boolean().default(true),
  blockClipboard: z.boolean().default(true),
  browserMonitoring: z.boolean().default(true),
  blockSearchEngines: z.boolean().default(true),
  resumeCount: z.number().min(0).default(1),
  webcamRequired: z.boolean().default(false),
  deviceTracking: z.boolean().default(true),
  screenshotBlocking: z.boolean().default(true),
  periodicUserValidation: z.boolean().default(true),
})

export type ExamFormValues = z.infer<typeof examFormSchema> 