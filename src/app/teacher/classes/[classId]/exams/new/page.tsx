'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { ExamForm } from '@/components/teacher-dashboard/exams/ExamForm'
import { useCreateExam } from '@/hooks/use-exams'
import { ExamFormValues } from '@/types/exam'

export default function NewExamPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.classId as string
  const { toast } = useToast()
  const createExam = useCreateExam(classId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Exam form state
  const [examData, setExamData] = useState<ExamFormValues>({
    title: '',
    description: '',
    duration: 60,
    startTime: null,
    endTime: null,
    classId: classId,
    questions: [],
    securityLevel: 'STANDARD',
    maxViolations: 3,
    fullScreenMode: true,
    blockMultipleTabs: true,
    blockKeyboardShortcuts: true,
    blockRightClick: true,
    blockClipboard: true,
    browserMonitoring: true,
    blockSearchEngines: true,
    resumeCount: 1,
    webcamRequired: false,
    deviceTracking: true,
    screenshotBlocking: true,
    periodicUserValidation: true,
  })

  const handleExamSubmit = async (data: ExamFormValues) => {
    try {
      setIsSubmitting(true)
      console.log('Creating exam with data:', data)

      // Validate required fields
      if (!data.title) {
        toast({
          title: 'Error',
          description: 'Title is required',
          variant: 'destructive',
        })
        return
      }

      if (!data.questions || data.questions.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one question to the exam.',
          variant: 'destructive',
        })
        return
      }

      // Create the exam
      await createExam.mutateAsync({
        title: data.title,
        description: data.description || '',
        duration: data.duration,
        startTime: data.startTime,
        endTime: data.endTime,
        classId: classId,
        questions: data.questions,
        // Security settings
        securityLevel: data.securityLevel || 'STANDARD',
        maxViolations: data.maxViolations || 3,
        fullScreenMode: data.fullScreenMode ?? true,
        blockMultipleTabs: data.blockMultipleTabs ?? true,
        blockKeyboardShortcuts: data.blockKeyboardShortcuts ?? true,
        blockRightClick: data.blockRightClick ?? true,
        blockClipboard: data.blockClipboard ?? true,
        browserMonitoring: data.browserMonitoring ?? true,
        blockSearchEngines: data.blockSearchEngines ?? true,
        resumeCount: data.resumeCount || 1,
        webcamRequired: data.webcamRequired ?? false,
        deviceTracking: data.deviceTracking ?? true,
        screenshotBlocking: data.screenshotBlocking ?? true,
        periodicUserValidation: data.periodicUserValidation ?? true,
      })

      toast({
        title: 'Success',
        description: 'Exam created successfully',
      })

      router.push(`/teacher/classes/${classId}/exams`)
    } catch (error) {
      console.error('Error creating exam:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create exam',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExamDataChange = (data: Partial<ExamFormValues>) => {
    setExamData(current => ({
      ...current,
      ...data,
    }))
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
            <p className="text-muted-foreground">
              Create a new exam for your class
            </p>
          </div>
          <Button onClick={() => router.back()}>Cancel</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ExamForm 
              onSubmit={handleExamSubmit}
              defaultValues={examData}
              onChange={handleExamDataChange}
              isLoading={isSubmitting}
              classId={classId}
            />
          </CardContent>
        </Card>
      </div>
    </TeacherDashboardLayout>
  )
}
