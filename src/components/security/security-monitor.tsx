"use client"

import { useEffect, useCallback } from "react"
import { useExamSecurity } from "@/hooks/use-exam-security"
import { ViolationType } from "@prisma/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AlertCircle, Camera, Maximize2, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SecurityMonitorProps {
  examId: string
  maxViolations: number
  fullScreenMode?: boolean
  blockMultipleTabs?: boolean
  screenshotBlocking?: boolean
  browserMonitoring?: boolean
  webcamRequired?: boolean
  className?: string
}

export function SecurityMonitor({
  examId,
  maxViolations,
  fullScreenMode = true,
  blockMultipleTabs = true,
  screenshotBlocking = true,
  browserMonitoring = true,
  webcamRequired = false,
  className,
}: SecurityMonitorProps) {
  const {
    isLocked,
    violationCount,
    isFullScreen,
    webcamActive,
    validationStatus,
  } = useExamSecurity({
    examId,
    maxViolations,
    fullScreenMode,
    blockMultipleTabs,
    screenshotBlocking,
    browserMonitoring,
    webcamRequired,
  })

  const requestFullScreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      toast.success("Entered full screen mode")
    } catch (error) {
      toast.error("Failed to enter full screen mode")
      console.error("Failed to enter full screen:", error)
    }
  }, [])

  // Handle full screen exit
  useEffect(() => {
    if (fullScreenMode && !isFullScreen && !isLocked) {
      toast.warning(
        "Full screen mode is required. Please click the button to enter full screen.",
        {
          duration: Infinity,
          action: {
            label: "Enter Full Screen",
            onClick: requestFullScreen,
          },
        }
      )
    }
  }, [fullScreenMode, isFullScreen, isLocked, requestFullScreen])

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Security Status
        </CardTitle>
        <CardDescription>
          Exam security monitoring and controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Violation Counter */}
        {violationCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security Violations Detected</AlertTitle>
            <AlertDescription>
              You have {violationCount} violation(s). Maximum allowed: {maxViolations}
            </AlertDescription>
          </Alert>
        )}

        {/* Full Screen Status */}
        {fullScreenMode && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              <span>Full Screen Mode</span>
            </div>
            {!isFullScreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestFullScreen}
                disabled={isLocked}
              >
                Enter Full Screen
              </Button>
            )}
          </div>
        )}

        {/* Webcam Status */}
        {webcamRequired && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>Webcam Status</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              webcamActive ? "text-green-600" : "text-red-600"
            )}>
              {webcamActive ? "Active" : "Not Active"}
            </span>
          </div>
        )}

        {/* Lock Status */}
        {isLocked && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Exam Locked</AlertTitle>
            <AlertDescription>
              Your exam has been locked due to excessive security violations.
              Please contact your proctor.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
