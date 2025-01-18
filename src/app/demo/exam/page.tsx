"use client"

import { useEffect, useState } from "react"
import { useExamSecurity } from "@/hooks/use-exam-security"
import { WebcamMonitor } from "@/components/security/webcam-monitor"
import { SecurityMonitor } from "@/components/security/security-monitor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

const DEMO_EXAM_ID = "demo-exam-001"

export default function ExamDemoPage() {
  const [showFullscreenDialog, setShowFullscreenDialog] = useState(false)
  const [isTemporarilyLocked, setIsTemporarilyLocked] = useState(false)
  
  const {
    isLocked,
    violationCount,
    isFullScreen,
    webcamActive,
    validationStatus,
    setFullScreen,
    setLocked,
  } = useExamSecurity({
    examId: DEMO_EXAM_ID,
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
    resumeCount: 3,
  })

  // Handle fullscreen changes
  const handleFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setFullScreen(true)
      setShowFullscreenDialog(false)
      setIsTemporarilyLocked(false)
    } catch (err) {
      console.error("Failed to enter full screen:", err)
      toast.error("Failed to enter full screen mode")
    }
  }

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = document.fullscreenElement !== null
      setFullScreen(isDocFullscreen)
      
      if (!isDocFullscreen) {
        setShowFullscreenDialog(true)
        setIsTemporarilyLocked(true)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [setFullScreen])

  // Force full screen on load
  useEffect(() => {
    if (!isFullScreen && !isLocked) {
      handleFullScreen()
    }
  }, [isFullScreen, isLocked])

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Exam Permanently Locked
            </CardTitle>
            <CardDescription>
              Your exam has been locked due to excessive security violations.
              Maximum violations (3) reached. Please contact your exam administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isTemporarilyLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Exam Temporarily Locked
            </CardTitle>
            <CardDescription className="space-y-4">
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Violation: Full Screen Required</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>You must remain in full screen mode during the exam.
                  This violation has been recorded.</p>
                  <p className="font-semibold">
                    ⚠️ WARNING: Your exam will be permanently locked after {3 - violationCount} violations!
                  </p>
                </AlertDescription>
              </Alert>
              
              <div className="rounded-md bg-destructive/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="font-medium">
                    Current Violations: {violationCount} / 3
                  </p>
                </div>
                {violationCount === 2 && (
                  <p className="mt-2 text-destructive font-semibold">
                    ⚠️ FINAL WARNING: One more violation will permanently lock your exam!
                  </p>
                )}
              </div>

              <Button 
                onClick={handleFullScreen} 
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                Return to Full Screen Mode
              </Button>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!isFullScreen || !webcamActive || validationStatus !== "validated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Security Check Required</CardTitle>
            <CardDescription>
              Please complete the following security checks to begin the exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Screen Check */}
            <div className="space-y-2">
              <h3 className="font-medium">Full Screen Mode</h3>
              {!isFullScreen ? (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Full Screen Required</AlertTitle>
                    <AlertDescription>
                      You must enter full screen mode to continue
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleFullScreen}
                    className="w-full"
                  >
                    Enter Full Screen
                  </Button>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>Full Screen Mode Active</AlertTitle>
                </Alert>
              )}
            </div>

            {/* Webcam Check */}
            <div className="space-y-2">
              <h3 className="font-medium">Webcam Check</h3>
              <WebcamMonitor examId={DEMO_EXAM_ID} required={true} />
            </div>

            {/* User Validation */}
            <div className="space-y-2">
              <h3 className="font-medium">User Validation</h3>
              {validationStatus !== "validated" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Required</AlertTitle>
                  <AlertDescription>
                    Please wait while we validate your identity
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Security Monitor */}
      <SecurityMonitor
        examId={DEMO_EXAM_ID}
        maxViolations={3}
        fullScreenMode={true}
        blockMultipleTabs={true}
        screenshotBlocking={true}
        browserMonitoring={true}
        webcamRequired={true}
        className="fixed top-4 right-4 z-50"
      />

      {/* Fullscreen Exit Dialog */}
      <Dialog open={showFullscreenDialog} onOpenChange={setShowFullscreenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Full Screen Required</DialogTitle>
            <DialogDescription className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Violation</AlertTitle>
                <AlertDescription>
                  You must remain in full screen mode during the exam. 
                  Exiting full screen mode will be recorded as a security violation.
                </AlertDescription>
              </Alert>
              <p>
                Current violations: {violationCount} / 3
              </p>
              <Button onClick={handleFullScreen} className="w-full">
                Return to Full Screen
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Main Exam Content */}
      <main className="container mx-auto p-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Demo Exam</CardTitle>
            <CardDescription>
              This is a demo exam with all security features enabled. Try the following:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2">
              <li>Exit full screen (will be blocked)</li>
              <li>Try to copy text (will be blocked)</li>
              <li>Try keyboard shortcuts like Ctrl+C, Alt+Tab (will be blocked)</li>
              <li>Try to open dev tools (will be blocked)</li>
              <li>Try to switch tabs (will be blocked)</li>
              <li>Try to take a screenshot (will be blocked)</li>
              <li>Try to disable webcam (will be blocked)</li>
            </ul>
            
            <div className="not-prose mt-4">
              <p className="text-sm text-muted-foreground">
                Current violations: {violationCount} / 3
              </p>
            </div>

            {/* Sample Exam Content */}
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-bold">Sample Question</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="radio" name="q1" id="q1a" />
                  <label htmlFor="q1a">Answer A</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" name="q1" id="q1b" />
                  <label htmlFor="q1b">Answer B</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" name="q1" id="q1c" />
                  <label htmlFor="q1c">Answer C</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
