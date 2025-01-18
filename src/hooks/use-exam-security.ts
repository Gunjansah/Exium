import { useEffect, useCallback, useState, useRef } from 'react'
import { ViolationType } from '@prisma/client'
import { create } from 'zustand'
import { toast } from 'sonner'
import { StateCreator, StoreApi } from 'zustand'

// Types and Interfaces
export interface SecurityViolation {
  id: string
  examId: string
  userId?: string
  type: ViolationType
  timestamp: Date
  details?: any
}

export interface SecurityConfig {
  examId: string
  maxViolations: number
  fullScreenMode: boolean
  blockMultipleTabs: boolean
  blockKeyboardShortcuts: boolean
  blockRightClick: boolean
  blockClipboard: boolean
  browserMonitoring: boolean
  blockSearchEngines: boolean
  deviceTracking: boolean
  screenshotBlocking: boolean
  periodicUserValidation: boolean
  webcamRequired: boolean
  resumeCount: number
}

export interface SecurityState {
  isFullScreen: boolean
  violationCount: number
  isLocked: boolean
  violations: SecurityViolation[]
  activeTabId: string
  lastActiveTime: number
  deviceFingerprint: string | null
  webcamActive: boolean
  searchEngineActive: boolean
  validationStatus: 'pending' | 'validating' | 'validated' | 'failed'
}

export interface SecurityStore extends SecurityState {
  config: SecurityConfig;
  incrementViolation: (violation: SecurityViolation) => void;
  setFullScreen: (isFullScreen: boolean) => void;
  setLocked: (isLocked: boolean) => void;
  setWebcamActive: (active: boolean) => void;
  setValidationStatus: (status: SecurityState['validationStatus']) => void;
  reset: () => void;
  subscribe: StoreApi<SecurityState>['subscribe'];
}

// Security Store
export const useSecurityStore = create<SecurityStore>((set, get, api) => ({
  // State
  isFullScreen: false,
  violationCount: 0,
  isLocked: false,
  violations: [],
  activeTabId: '',
  lastActiveTime: Date.now(),
  deviceFingerprint: null,
  webcamActive: false,
  searchEngineActive: false,
  validationStatus: 'pending' as const,
  config: {} as SecurityConfig,

  // Actions
  incrementViolation(violation: SecurityViolation) {
    set(state => {
      const newViolationCount = state.violationCount + 1
      const newState: Partial<SecurityState> = {
        violationCount: newViolationCount,
        violations: [...state.violations, violation],
        isLocked: newViolationCount >= state.config.maxViolations
      }
      
      // Show appropriate toast message
      if (newState.isLocked) {
        toast.error('Maximum violations reached. Exam is now locked.')
      } else {
        const remaining = state.config.maxViolations - newViolationCount
        toast.error(`Security Violation! ${remaining} ${remaining === 1 ? 'warning' : 'warnings'} remaining before exam lock.`)
      }
      
      return newState
    })
  },

  setFullScreen(isFullScreen: boolean) {
    set(state => ({ isFullScreen }))
  },

  setLocked(isLocked: boolean) {
    set(state => ({ isLocked }))
  },

  setWebcamActive(active: boolean) {
    set({ webcamActive: active })
  },

  setValidationStatus(status: SecurityState['validationStatus']) {
    set({ validationStatus: status })
  },

  reset() {
    set({
      isFullScreen: false,
      violationCount: 0,
      isLocked: false,
      violations: [],
      activeTabId: '',
      lastActiveTime: Date.now(),
      deviceFingerprint: null,
      webcamActive: false,
      searchEngineActive: false,
      validationStatus: 'pending',
      config: {} as SecurityConfig
    })
  },

  subscribe: api.subscribe
}))

// Main Hook
export function useExamSecurity(config: Partial<SecurityConfig>) {
  const store = useSecurityStore()
  const workerRef = useRef<Worker | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize security worker
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return

    workerRef.current = new Worker(new URL('../workers/security.worker.ts', import.meta.url))
    workerRef.current.onmessage = handleWorkerMessage
    setIsInitialized(true)

    return () => workerRef.current?.terminate()
  }, [isInitialized])

  // Record violation with backend
  const recordViolation = useCallback(async (type: ViolationType, details?: any) => {
    const violation: SecurityViolation = {
      id: crypto.randomUUID(),
      examId,
      userId: '', // Will be set by the API
      type,
      timestamp: new Date(),
      details,
    }
    store.incrementViolation(violation)
  }, [config.examId, store])

  // Handle worker messages
  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, payload } = event.data
    switch (type) {
      case 'VIOLATION_DETECTED':
        recordViolation(payload.violationType, payload.details)
        break
      case 'SECURITY_STATUS_UPDATE':
        switch (payload.type) {
          case 'FULLSCREEN':
            store.setFullScreen(payload.status)
            break
          case 'WEBCAM':
            store.setWebcamActive(payload.status)
            break
          case 'VALIDATION':
            store.setValidationStatus(payload.status)
            break
        }
        break
      default:
        console.warn('Unknown worker message type:', type)
    }
  }, [recordViolation, store])

  // Return state and actions
  return {
    isLocked: store.isLocked,
    violationCount: store.violationCount,
    isFullScreen: store.isFullScreen,
    violations: store.violations,
    webcamActive: store.webcamActive,
    validationStatus: store.validationStatus,
    // Add store actions
    setWebcamActive: store.setWebcamActive,
    setFullScreen: store.setFullScreen,
    setLocked: store.setLocked,
    setValidationStatus: store.setValidationStatus,
    incrementViolation: store.incrementViolation,
    reset: store.reset
  }
}
