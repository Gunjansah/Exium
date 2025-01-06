import { useEffect, useCallback, useState } from 'react'
import { ViolationType } from '@prisma/client'
import { SecurityViolation } from '@/types/exam'

interface UseExamSecurityProps {
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

interface SecurityState {
  isFullScreen: boolean
  violationCount: number
  isLocked: boolean
  violations: SecurityViolation[]
}

export function useExamSecurity({
  examId,
  maxViolations,
  fullScreenMode = true,
  blockMultipleTabs = true,
  blockKeyboardShortcuts = true,
  blockRightClick = true,
  blockClipboard = true,
  browserMonitoring = true,
  blockSearchEngines = true,
  deviceTracking = true,
  screenshotBlocking = true,
  periodicUserValidation = true,
}: UseExamSecurityProps) {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isFullScreen: false,
    violationCount: 0,
    isLocked: false,
    violations: [],
  })

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
      const response = await fetch(`/api/exams/${examId}/violations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(violation),
      })

      if (!response.ok) {
        throw new Error('Failed to record violation')
      }

      setSecurityState((prev) => ({
        ...prev,
        violationCount: prev.violationCount + 1,
        violations: [...prev.violations, violation],
        isLocked: prev.violationCount + 1 >= maxViolations,
      }))
    } catch (error) {
      console.error('Failed to record security violation:', error)
    }
  }, [examId, maxViolations])

  // Handle full screen mode
  useEffect(() => {
    if (!fullScreenMode) return

    const handleFullScreenChange = () => {
      const isFullScreen = document.fullscreenElement !== null
      setSecurityState((prev) => ({ ...prev, isFullScreen }))

      if (!isFullScreen) {
        recordViolation(ViolationType.FULL_SCREEN_EXIT)
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [fullScreenMode, recordViolation])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!blockKeyboardShortcuts) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a', 'p', 'r', 'f'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault()
        recordViolation(ViolationType.KEYBOARD_SHORTCUT, { key: e.key })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [blockKeyboardShortcuts, recordViolation])

  // Handle right click
  useEffect(() => {
    if (!blockRightClick) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      recordViolation(ViolationType.RIGHT_CLICK)
    }

    window.addEventListener('contextmenu', handleContextMenu)
    return () => window.removeEventListener('contextmenu', handleContextMenu)
  }, [blockRightClick, recordViolation])

  // Handle clipboard
  useEffect(() => {
    if (!blockClipboard) return

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      recordViolation(ViolationType.CLIPBOARD_USAGE, { action: 'copy' })
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      recordViolation(ViolationType.CLIPBOARD_USAGE, { action: 'paste' })
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
    }
  }, [blockClipboard, recordViolation])

  // Handle tab visibility
  useEffect(() => {
    if (!blockMultipleTabs) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation(ViolationType.TAB_SWITCH)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [blockMultipleTabs, recordViolation])

  // Handle periodic user validation
  useEffect(() => {
    if (!periodicUserValidation) return

    const checkInterval = setInterval(() => {
      // Implement user validation check here
      // This could be a simple prompt or a more sophisticated check
      const isValid = window.confirm('Please confirm your presence')
      if (!isValid) {
        recordViolation(ViolationType.PERIODIC_CHECK_FAILED)
      }
    }, 15 * 60 * 1000) // Check every 15 minutes

    return () => clearInterval(checkInterval)
  }, [periodicUserValidation, recordViolation])

  const requestFullScreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch (error) {
      console.error('Failed to enter full screen:', error)
    }
  }, [])

  return {
    securityState,
    requestFullScreen,
    recordViolation,
  }
}
