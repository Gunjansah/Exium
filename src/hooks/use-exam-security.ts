import { useEffect, useCallback, useState } from 'react'
import { ViolationType } from '@prisma/client'
import { create } from 'zustand'
import { toast } from 'sonner'

// Types and Interfaces
interface SecurityViolation {
  id: string
  examId: string
  userId?: string
  type: ViolationType
  timestamp: Date
  details?: any
}

interface SecurityConfig {
  examId: string
  maxViolations: number
  fullScreenMode?: boolean
  blockMultipleTabs?: boolean
  blockKeyboardShortcuts?: boolean
  blockRightClick?: boolean
  blockClipboard?: boolean
  browserMonitoring?: boolean
  blockSearchEngines?: boolean
  deviceTracking?: boolean
  screenshotBlocking?: boolean
  periodicUserValidation?: boolean
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

interface SecurityStore extends SecurityState {
  config: SecurityConfig
  incrementViolation: (violation: SecurityViolation) => void
  setFullScreen: (isFullScreen: boolean) => void
  setLocked: (isLocked: boolean) => void
  setWebcamActive: (active: boolean) => void
  setValidationStatus: (status: SecurityState['validationStatus']) => void
  reset: () => void
}

// Security Store
const useSecurityStore = create<SecurityStore>((set) => ({
  isFullScreen: false,
  violationCount: 0,
  isLocked: false,
  violations: [],
  activeTabId: crypto.randomUUID(),
  lastActiveTime: Date.now(),
  deviceFingerprint: null,
  webcamActive: false,
  searchEngineActive: false,
  validationStatus: 'pending',
  config: {
    examId: '',
    maxViolations: 3,
    fullScreenMode: true,
    blockMultipleTabs: true,
    blockKeyboardShortcuts: true,
    blockRightClick: true,
    blockClipboard: true,
    browserMonitoring: true,
    blockSearchEngines: true,
    deviceTracking: true,
    screenshotBlocking: true,
    periodicUserValidation: true,
    webcamRequired: true,
    resumeCount: 0,
  },
  incrementViolation: (violation) =>
    set((state) => {
      const newViolations = [...state.violations, violation]
      const newCount = state.violationCount + 1
      const shouldLock = newCount >= state.config.maxViolations

      if (shouldLock) {
        toast.error('Maximum violations reached. Exam is now locked.')
      } else {
        toast.warning(`Security violation detected. ${state.config.maxViolations - newCount} warnings remaining.`)
      }

      return {
        violations: newViolations,
        violationCount: newCount,
        isLocked: shouldLock,
      }
    }),
  setFullScreen: (isFullScreen) => set({ isFullScreen }),
  setLocked: (isLocked) => set({ isLocked }),
  setWebcamActive: (active) => set({ webcamActive: active }),
  setValidationStatus: (status) => set({ validationStatus: status }),
  reset: () =>
    set({
      violationCount: 0,
      isLocked: false,
      violations: [],
      validationStatus: 'pending',
    }),
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

    try {
      const response = await fetch(`/api/exams/${config.examId}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation),
      })

      if (!response.ok) throw new Error('Failed to record violation')
      store.incrementViolation(violation)
    } catch (error) {
      console.error('Failed to record security violation:', error)
      toast.error('Failed to record security violation')
    }
  }, [config.examId])

  // Handle worker messages
  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, payload } = event.data
    switch (type) {
      case 'VIOLATION_DETECTED':
        recordViolation(payload.violationType, payload.details)
        break
      case 'SECURITY_STATUS_UPDATE':
        // Handle security status updates
        break
      default:
        console.warn('Unknown worker message type:', type)
    }
  }, [recordViolation])

  // Initialize security features
  useEffect(() => {
    if (!isInitialized || !config.examId) return

    const initSecurity = async () => {
      try {
        // Initialize device fingerprint
        const fpPromise = import('@fingerprintjs/fingerprintjs')
        const fp = await fpPromise
        const result = await fp.load()
        const fingerprint = await result.get()
        
        // Send initial configuration to worker
        workerRef.current?.postMessage({
          type: 'INIT_SECURITY',
          payload: {
            config: { ...store.config, ...config },
            fingerprint: fingerprint.visitorId,
          },
        })

        // Request full screen if required
        if (config.fullScreenMode) {
          document.documentElement.requestFullscreen()
        }
      } catch (error) {
        console.error('Failed to initialize security:', error)
        toast.error('Failed to initialize security features')
      }
    }

    initSecurity()
  }, [config, isInitialized])

  // Cleanup
  useEffect(() => {
    return () => {
      store.reset()
      workerRef.current?.terminate()
    }
  }, [])

  return {
    isLocked: store.isLocked,
    violationCount: store.violationCount,
    isFullScreen: store.isFullScreen,
    violations: store.violations,
    validationStatus: store.validationStatus,
    webcamActive: store.webcamActive,
  }
}
