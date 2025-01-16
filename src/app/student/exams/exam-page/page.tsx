'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { ViolationType } from '@prisma/client'

interface ExamData {
  id: string
  title: string
  description?: string
  duration: number
  questions: Array<{
    id: string
    content: string
    type: string
    points: number
    options?: Array<{ text: string }>
    timeLimit?: number
  }>
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

export default function ExamEnvironment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const examId = searchParams.get('id')
  const [violations, setViolations] = useState<Array<{ type: ViolationType, timestamp: Date }>>([])
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showViolationDialog, setShowViolationDialog] = useState(false)
  const [currentViolation, setCurrentViolation] = useState<{ type: ViolationType; message: string } | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Redirect if no examId
  useEffect(() => {
    if (!examId) {
      router.push('/student/exams')
    }
  }, [examId, router])

  // Fetch exam data
  const { data: exam, isLoading } = useQuery<ExamData>({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const response = await fetch(`/api/student/exams/${examId}`)
      if (!response.ok) throw new Error('Failed to fetch exam')
      return response.json()
    },
    enabled: !!examId,
  })

  // Record violation mutation
  const recordViolationMutation = useMutation({
    mutationFn: async (violationType: ViolationType) => {
      const response = await fetch(`/api/student/exams/${examId}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: violationType }),
      })
      if (!response.ok) throw new Error('Failed to record violation')
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] })
    },
  })

  // Submit exam mutation
  const submitExamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/student/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to submit exam')
      return response.json()
    },
    onSuccess: () => {
      toast.success('Exam submitted successfully')
      router.push('/student/dashboard')
    },
  })

  const handleViolation = useCallback((type: ViolationType, message: string) => {
    setViolations(prev => [...prev, { type, timestamp: new Date() }])
    setCurrentViolation({ type, message })
    setShowViolationDialog(true)
    recordViolationMutation.mutate(type)

    if (violations.length + 1 >= (exam?.maxViolations || 3)) {
      submitExamMutation.mutate({ autoSubmitted: true })
    }
  }, [violations, exam?.maxViolations, recordViolationMutation, submitExamMutation])

  // Security event handlers
  useEffect(() => {
    if (!exam) return

    const handleVisibilityChange = () => {
      if (document.hidden && exam.blockMultipleTabs) {
        handleViolation(ViolationType.TAB_SWITCH, 'Tab switching detected')
      }
    }

    const handleFullscreenChange = () => {
      const isCurrentlyFullScreen = document.fullscreenElement !== null
      setIsFullScreen(isCurrentlyFullScreen)
      if (!isCurrentlyFullScreen && exam.fullScreenMode) {
        handleViolation(ViolationType.FULL_SCREEN_EXIT, 'Fullscreen mode exited')
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (exam.blockKeyboardShortcuts) {
        if ((e.ctrlKey || e.metaKey) && e.key !== 'F5') {
          e.preventDefault()
          handleViolation(ViolationType.KEYBOARD_SHORTCUT, 'Keyboard shortcut detected')
        }
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      if (exam.blockRightClick) {
        e.preventDefault()
        handleViolation(ViolationType.RIGHT_CLICK, 'Right-click detected')
      }
    }

    const handleCopy = (e: ClipboardEvent) => {
      if (exam.blockClipboard) {
        e.preventDefault()
        handleViolation(ViolationType.CLIPBOARD_USAGE, 'Copy attempt detected')
      }
    }

    // Set up periodic checks
    const periodicCheck = setInterval(() => {
      if (exam.periodicUserValidation) {
        // Check for multiple displays
        if (window.screen && 'orientation' in window.screen) {
          navigator.mediaDevices.enumerateDevices()
            .then(devices => {
              const displays = devices.filter(device => device.kind === 'videoinput')
              if (displays.length > 1) {
                handleViolation(ViolationType.MULTIPLE_DEVICES, 'Multiple displays detected')
              }
            })
        }
      }
    }, 30000)

    // Initialize fullscreen
    if (exam.fullScreenMode && !isFullScreen) {
      document.documentElement.requestFullscreen()
    }

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handleCopy)
    document.addEventListener('cut', handleCopy)

    // Timer setup
    if (exam.duration) {
      setTimeRemaining(exam.duration * 60) // Convert to seconds
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer)
            submitExamMutation.mutate({ autoSubmitted: true })
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handleCopy)
      document.removeEventListener('cut', handleCopy)
      clearInterval(periodicCheck)
    }
  }, [exam, isFullScreen, handleViolation])

  if (isLoading || !exam) {
    return <div>Loading exam environment...</div>
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header with exam info and timer */}
      <div className="fixed top-0 left-0 right-0 bg-background border-b p-4 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">
              Violations: {violations.length} / {exam.maxViolations}
            </p>
          </div>
          {timeRemaining !== null && (
            <div className="text-xl font-mono">
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      {/* Main exam content */}
      <div className="mt-24 max-w-7xl mx-auto">
        {exam.questions.map((question, index) => (
          <Card key={question.id} className="p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                Question {index + 1} ({question.points} points)
              </h3>
              {question.timeLimit && (
                <span className="text-sm text-muted-foreground">
                  Time limit: {question.timeLimit} minutes
                </span>
              )}
            </div>
            <div className="prose max-w-none">
              {question.content}
            </div>
            {/* Question-specific answer components will be rendered here */}
          </Card>
        ))}
      </div>

      {/* Violation Dialog */}
      <Dialog open={showViolationDialog} onOpenChange={setShowViolationDialog}>
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Security Violation Detected</h2>
            <p className="mb-4">{currentViolation?.message}</p>
            <p className="text-muted-foreground mb-4">
              Violations: {violations.length} / {exam.maxViolations}
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowViolationDialog(false)}>
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
} 