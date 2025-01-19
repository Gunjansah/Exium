import { useEffect, useCallback, useState, useRef } from 'react'
import { ViolationType } from '@prisma/client'
import { create } from 'zustand'
import { toast } from 'sonner'
import { StateCreator, StoreApi } from 'zustand'
import { BehaviorAnalyzer } from '@/lib/security/behavior-analysis'

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
  behaviorAnalyzer?: BehaviorAnalyzer
  incrementViolation: (violation: SecurityViolation) => void;
  setFullScreen: (isFullScreen: boolean) => void;
  setLocked: (isLocked: boolean) => void;
  setWebcamActive: (active: boolean) => void;
  setValidationStatus: (status: SecurityState['validationStatus']) => void;
  reset: () => void;
  subscribe: StoreApi<SecurityState>['subscribe'];
  initializeSecurity: (config: SecurityConfig) => void;
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
  behaviorAnalyzer: undefined,

  // Actions
  incrementViolation: async (violation: SecurityViolation) => {
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
      config: {} as SecurityConfig,
      behaviorAnalyzer: undefined
    })
  },

  initializeSecurity(config: SecurityConfig) {
    const behaviorAnalyzer = new BehaviorAnalyzer(
      (type, details) => get().incrementViolation({ id: crypto.randomUUID(), examId: config.examId, userId: '', type, timestamp: new Date(), details: JSON.stringify(details) }),
      {
        maxBufferSize: 100,
        analysisInterval: 5000, // 5 seconds
        suspiciousThreshold: 1000 // pixels per second
      }
    )
    
    set({ behaviorAnalyzer, config })
  },

  subscribe: api.subscribe
}))

// Main Hook
export function useExamSecurity(config: Partial<SecurityConfig>) {
  const securityStore = useSecurityStore()
  const workerRef = useRef<Worker | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return

    workerRef.current = new Worker(new URL('../workers/security.worker.ts', import.meta.url))
    workerRef.current.onmessage = handleWorkerMessage
    setIsInitialized(true)

    return () => workerRef.current?.terminate()
  }, [isInitialized])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      securityStore.behaviorAnalyzer?.recordKeystroke(e)
    }

    const handleMouseMove = (e: Event) => {
      if (e instanceof MouseEvent) {
        securityStore.behaviorAnalyzer?.recordMouseMovement(e)
      }
    }

    const handleScroll = (e: Event) => {
      // idk but needs a synthetic mouse event with the current cursor position for scroll
      const mouseEvent = new MouseEvent('scroll', {
        clientX: window.scrollX,
        clientY: window.scrollY,
      })
      securityStore.behaviorAnalyzer?.recordMouseMovement(mouseEvent)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleMouseMove)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [securityStore])

  // Record violation with backend
  const recordViolation = useCallback(async (type: ViolationType, details?: any) => {
    const violation: SecurityViolation = {
      id: crypto.randomUUID(),
      examId: config.examId || '',
      userId: '', // Will be set by the API
      type,
      timestamp: new Date(),
      details: JSON.stringify(details)
    }
    securityStore.incrementViolation(violation)
  }, [config.examId, securityStore])

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
            securityStore.setFullScreen(payload.status)
            break
          case 'WEBCAM':
            securityStore.setWebcamActive(payload.status)
            break
          case 'VALIDATION':
            securityStore.setValidationStatus(payload.status)
            break
        }
        break
      default:
        console.warn('Unknown worker message type:', type)
    }
  }, [recordViolation, securityStore])

  // Return state and actions
  return {
    isLocked: securityStore.isLocked,
    violationCount: securityStore.violationCount,
    isFullScreen: securityStore.isFullScreen,
    violations: securityStore.violations,
    webcamActive: securityStore.webcamActive,
    validationStatus: securityStore.validationStatus,
    // Add store actions
    setWebcamActive: securityStore.setWebcamActive,
    setFullScreen: securityStore.setFullScreen,
    setLocked: securityStore.setLocked,
    setValidationStatus: securityStore.setValidationStatus,
    incrementViolation: securityStore.incrementViolation,
    reset: securityStore.reset,
    initializeSecurity: securityStore.initializeSecurity
  }
}
