'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { Loader2, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function JoinByCode() {
  const [classCode, setClassCode] = useState('')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const queryClient = useQueryClient()

  const enrollMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/student/classes/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classCode: code }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join class')
      }
      return response.json()
    },
    onSuccess: (data) => {
      setClassCode('')
      queryClient.invalidateQueries({ queryKey: ['available-classes'] })
      setShowSuccessDialog(true)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a class code',
        variant: 'destructive',
      })
      return
    }
    enrollMutation.mutate(classCode.trim())
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Join with Code</CardTitle>
            </div>
            <CardDescription>
              Have a class code? Enter it below to join the class instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="Enter class code (e.g., ABC123)"
                  disabled={enrollMutation.isPending}
                  className="font-mono text-lg tracking-wider"
                />
                <p className="text-sm text-muted-foreground">
                  The class code should be provided by your teacher
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={enrollMutation.isPending}
                className="w-full"
              >
                {enrollMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining Class...
                  </>
                ) : (
                  <>
                    Join Class
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4 md:col-span-1">
          <Alert>
            <AlertTitle>How to join a class?</AlertTitle>
            <AlertDescription className="mt-3">
              <ol className="list-decimal list-inside space-y-2">
                <li>Ask your teacher for the class code</li>
                <li>Enter the code in the input field</li>
                <li>Click &quot;Join Class&quot;</li>
                <li>Wait for teacher approval</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTitle>Can&apos;t find your class?</AlertTitle>
            <AlertDescription className="mt-2">
              Make sure you have the correct class code. If you&apos;re still having trouble,
              contact your teacher or browse available classes below.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Enrollment Request Submitted
            </DialogTitle>
            <DialogDescription>
              Your request to join the class has been submitted successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="success">
              <AlertTitle>Request Details</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-2">
                  <p><strong>Class:</strong> {enrollMutation.data?.data.className}</p>
                  <p><strong>Teacher:</strong> {enrollMutation.data?.data.teacherName}</p>
                </div>
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTitle>What happens next?</AlertTitle>
              <AlertDescription className="mt-2">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Your teacher will review your enrollment request</li>
                  <li>You&apos;ll receive a notification when it&apos;s approved</li>
                  <li>Once approved, you&apos;ll have access to the class materials</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="w-full sm:w-auto"
            >
              Got it, thanks!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 