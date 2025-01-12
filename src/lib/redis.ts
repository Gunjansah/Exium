import { Redis } from 'ioredis'

// In-memory fallback storage
const inMemoryStorage = new Map<string, { value: string; expiry: number }>()

class RedisFallback {
  private redis: Redis | null = null
  private useInMemory = false

  constructor() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) {
              this.useInMemory = true
              return null
            }
            return Math.min(times * 50, 2000)
          }
        })

        this.redis.on('error', (error) => {
          console.warn('Redis connection error, falling back to in-memory storage:', error.message)
          this.useInMemory = true
        })
      } else {
        console.warn('REDIS_URL not found, using in-memory storage')
        this.useInMemory = true
      }
    } catch (error) {
      console.warn('Failed to initialize Redis, using in-memory storage:', error)
      this.useInMemory = true
    }
  }

  async set(key: string, value: string, expiryMode?: string, time?: number): Promise<'OK' | null> {
    try {
      if (!this.useInMemory && this.redis) {
        if (expiryMode === 'EX' && time) {
          return await this.redis.set(key, value, 'EX', time)
        }
        return await this.redis.set(key, value)
      }
      
      // Fallback to in-memory storage
      const expiry = time ? Date.now() + (time * 1000) : 0
      inMemoryStorage.set(key, { value, expiry })
      return 'OK'
    } catch (error) {
      console.error('Error setting value:', error)
      return null
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.useInMemory && this.redis) {
        return await this.redis.get(key)
      }
      
      // Fallback to in-memory storage
      const data = inMemoryStorage.get(key)
      if (!data) return null
      
      if (data.expiry && data.expiry < Date.now()) {
        inMemoryStorage.delete(key)
        return null
      }
      
      return data.value
    } catch (error) {
      console.error('Error getting value:', error)
      return null
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (!this.useInMemory && this.redis) {
        return await this.redis.del(key)
      }
      
      // Fallback to in-memory storage
      return inMemoryStorage.delete(key) ? 1 : 0
    } catch (error) {
      console.error('Error deleting value:', error)
      return 0
    }
  }
}

// Create a singleton instance
const redisFallback = new RedisFallback()

// Helper functions for exam creation
export const EXAM_DRAFT_EXPIRY = 60 * 60 // 1 hour

export async function saveExamDraft(teacherId: string, examData: any) {
  const key = `exam:draft:${teacherId}`
  await redisFallback.set(key, JSON.stringify(examData), 'EX', EXAM_DRAFT_EXPIRY)
  return key
}

export async function getExamDraft(teacherId: string) {
  const key = `exam:draft:${teacherId}`
  const data = await redisFallback.get(key)
  return data ? JSON.parse(data) : null
}

export async function updateExamDraft(teacherId: string, examData: any) {
  return saveExamDraft(teacherId, examData)
}

export async function deleteExamDraft(teacherId: string) {
  const key = `exam:draft:${teacherId}`
  await redisFallback.del(key)
}

export async function addQuestionToDraft(teacherId: string, question: any) {
  const key = `exam:draft:${teacherId}`
  const examDraft = await getExamDraft(teacherId)
  if (examDraft) {
    examDraft.questions = [...(examDraft.questions || []), question]
    await saveExamDraft(teacherId, examDraft)
  }
  return examDraft
}

export async function removeQuestionFromDraft(teacherId: string, questionIndex: number) {
  const key = `exam:draft:${teacherId}`
  const examDraft = await getExamDraft(teacherId)
  if (examDraft && examDraft.questions) {
    examDraft.questions = examDraft.questions.filter((_: any, index: number) => index !== questionIndex)
    await saveExamDraft(teacherId, examDraft)
  }
  return examDraft
} 