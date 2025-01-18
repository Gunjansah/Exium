"use client"

import { useEffect, useRef, useState } from "react"
import { useExamSecurity } from "@/hooks/use-exam-security"
import { ViolationType } from "@prisma/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Camera, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface WebcamMonitorProps {
  examId: string
  required?: boolean
  className?: string
}

export function WebcamMonitor({ examId, required = false, className }: WebcamMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string>()
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const { webcamActive, setWebcamActive } = useExamSecurity({ examId })

  const startWebcam = async () => {
    try {
      // First check if we have permissions
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
      
      if (permissions.state === 'denied') {
        if (required) {
          setShowPermissionDialog(true)
          setError("Webcam access is required for this exam")
          setWebcamActive(false)
          return
        }
        setError("Webcam access denied")
        setWebcamActive(false)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setWebcamActive(true)
      }

      setError(undefined)
      setShowPermissionDialog(false)
    } catch (err) {
      console.error("Failed to access webcam:", err)
      if (required) {
        setShowPermissionDialog(true)
        setError("Webcam access is required for this exam")
      } else {
        setError("Failed to access webcam. Please ensure webcam access is allowed.")
      }
      setWebcamActive(false)
      toast.error("Failed to access webcam")
    }
  }

  useEffect(() => {
    startWebcam()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleRetryPermission = () => {
    startWebcam()
  }

  return (
    <>
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Webcam Monitor
          </CardTitle>
          <CardDescription>
            {required ? "Webcam is required for exam proctoring" : "Exam proctoring webcam feed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Webcam Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{error}</p>
                {required && (
                  <Button variant="outline" size="sm" onClick={handleRetryPermission}>
                    Enable Webcam Access
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!webcamActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <p className="text-sm text-muted-foreground">
                    Webcam inactive
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webcam Access Required</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                This exam requires webcam access for proctoring. You must enable webcam access to proceed with the exam.
              </p>
              <p>
                To enable webcam access:
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click the camera icon in your browser's address bar</li>
                  <li>Select "Allow" for camera access</li>
                  <li>Click the "Enable Webcam Access" button below</li>
                </ol>
              </p>
              <Button onClick={handleRetryPermission} className="w-full">
                Enable Webcam Access
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
