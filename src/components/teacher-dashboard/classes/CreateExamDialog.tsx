'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { debounce } from 'lodash'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { QuestionForm } from '../questions/QuestionForm'
import { QuestionType } from '@prisma/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CreateExamDialogProps {
  classId: string
  trigger?: React.ReactNode
}

const examFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  timeLimit: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  isPublished: z.boolean().default(false),
  questions: z.array(z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'MATCHING', 'CODING']),
    content: z.string().min(1, 'Question content is required'),
    points: z.number().min(1, 'Points must be at least 1'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })).optional(),
    correctAnswer: z.string().optional(),
    rubric: z.string().optional(),
    matchingPairs: z.array(z.object({
      left: z.string().min(1, 'Left side is required'),
      right: z.string().min(1, 'Right side is required'),
    })).optional(),
    codeTemplate: z.string().optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string().min(1, 'Expected output is required'),
      isHidden: z.boolean(),
      explanation: z.string().optional(),
    })).optional(),
    programmingLanguage: z.string().optional(),
  })).min(1, 'At least one question is required'),
  // Security settings
  blockClipboard: z.boolean().default(true),
  blockKeyboardShortcuts: z.boolean().default(true),
  blockMultipleTabs: z.boolean().default(true),
  blockRightClick: z.boolean().default(true),
  blockSearchEngines: z.boolean().default(true),
  browserMonitoring: z.boolean().default(true),
  deviceTracking: z.boolean().default(true),
  fullScreenMode: z.boolean().default(true),
  maxViolations: z.number().min(1).default(3),
  periodicUserValidation: z.boolean().default(true),
  resumeCount: z.number().min(1).default(1),
  screenshotBlocking: z.boolean().default(true),
  securityLevel: z.enum(['STANDARD', 'HIGH', 'CUSTOM']).default('STANDARD'),
  webcamRequired: z.boolean().default(false),
})

type ExamFormValues = z.infer<typeof examFormSchema>

export function CreateExamDialog({ classId, trigger }: CreateExamDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const queryClient = useQueryClient()

  // Add query for fetching draft
  const draftQuery = useQuery({
    queryKey: ['examDraft', classId],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams/draft`)
      if (!response.ok) {
        throw new Error('Failed to fetch draft')
      }
      return response.json()
    },
    enabled: open, // Only fetch when dialog is open
  })

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: '',
      description: '',
      timeLimit: 0,
      isPublished: false,
      questions: [],
      blockClipboard: true,
      blockKeyboardShortcuts: true,
      blockMultipleTabs: true,
      blockRightClick: true,
      blockSearchEngines: true,
      browserMonitoring: true,
      deviceTracking: true,
      fullScreenMode: true,
      maxViolations: 3,
      periodicUserValidation: true,
      resumeCount: 1,
      screenshotBlocking: true,
      securityLevel: 'STANDARD',
      webcamRequired: false,
    },
  })

  // Load draft data when available
  useEffect(() => {
    if (draftQuery.data && Object.keys(draftQuery.data).length > 0) {
      form.reset(draftQuery.data)
    }
  }, [draftQuery.data, form])

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: { action: string; data?: any; question?: any; questionIndex?: number }) => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examDraft', classId] })
    },
  })

  // Delete draft mutation
  const deleteDraftMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams/draft`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete draft')
      }

      return response.json()
    },
  })

  const createExamMutation = useMutation({
    mutationFn: async (data: ExamFormValues & { fromDraft?: boolean }) => {
      const response = await fetch(`/api/teacher/classes/${classId}/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create exam')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', classId] })
      toast.success('Exam created successfully')
      setOpen(false)
      form.reset()
      // Delete the draft after successful creation
      deleteDraftMutation.mutate()
    },
    onError: (error) => {
      console.error('Failed to create exam:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create exam')
    },
  })

  const onSubmit = (data: ExamFormValues) => {
    if (data.questions.length === 0) {
      toast.error('Please add at least one question')
      setActiveTab('questions')
      return
    }

    // Calculate total points
    const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0)
    
    // Validate time limit if set
    if (data.timeLimit && data.timeLimit < data.questions.reduce((sum, q) => sum + (q.timeLimit || 0), 0)) {
      toast.error('Total exam time limit cannot be less than sum of question time limits')
      setActiveTab('settings')
      return
    }

    // Validate security settings based on security level
    if (data.securityLevel === 'HIGH' && !data.webcamRequired) {
      form.setValue('webcamRequired', true)
    }

    // Create exam with draft flag if draft exists
    createExamMutation.mutate({
      ...data,
      fromDraft: Boolean(draftQuery.data && Object.keys(draftQuery.data).length > 0)
    })
  }

  const handleAddQuestion = (questionData: ExamFormValues['questions'][0]) => {
    // Save question to draft
    saveDraftMutation.mutate({
      action: 'addQuestion',
      question: questionData,
    })
    setActiveTab('questions')
    toast.success('Question added successfully')
  }

  const handleRemoveQuestion = (index: number) => {
    // Remove question from draft
    saveDraftMutation.mutate({
      action: 'removeQuestion',
      questionIndex: index,
    })
  }

  const handleSecurityLevelChange = (level: 'STANDARD' | 'HIGH' | 'CUSTOM') => {
    const securitySettings = {
      STANDARD: {
        blockClipboard: true,
        blockKeyboardShortcuts: true,
        blockMultipleTabs: true,
        blockRightClick: true,
        blockSearchEngines: true,
        browserMonitoring: true,
        deviceTracking: true,
        fullScreenMode: true,
        maxViolations: 3,
        periodicUserValidation: true,
        resumeCount: 1,
        screenshotBlocking: true,
        webcamRequired: false,
      },
      HIGH: {
        blockClipboard: true,
        blockKeyboardShortcuts: true,
        blockMultipleTabs: true,
        blockRightClick: true,
        blockSearchEngines: true,
        browserMonitoring: true,
        deviceTracking: true,
        fullScreenMode: true,
        maxViolations: 2,
        periodicUserValidation: true,
        resumeCount: 0,
        screenshotBlocking: true,
        webcamRequired: true,
      },
      CUSTOM: {},
    }

    const settings = securitySettings[level]
    const formData = form.getValues()
    const updatedData = {
      ...formData,
      ...settings,
      securityLevel: level,
    }

    // Update form and save to draft
    form.reset(updatedData)
    saveDraftMutation.mutate({
      action: 'update',
      data: updatedData,
    })
  }

  // Auto-save form changes to draft
  const debouncedSave = useMemo(
    () =>
      debounce((data: ExamFormValues) => {
        saveDraftMutation.mutate({
          action: 'update',
          data,
        })
      }, 1000),
    [saveDraftMutation]
  )

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (open && value) {
        debouncedSave(value as ExamFormValues)
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch, open, debouncedSave])

  // Clean up draft when dialog is closed
  useEffect(() => {
    if (!open) {
      form.reset()
      if (draftQuery.data && Object.keys(draftQuery.data).length > 0) {
        deleteDraftMutation.mutate()
      }
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Exam</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Create a new exam with questions and settings
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide additional details about the exam (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Set to 0 for no time limit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        When should this exam be due? (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="questions" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">
                      Questions ({form.watch('questions').length})
                    </h4>
                  </div>
                  {form.watch('questions').map((question, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">
                            Question {index + 1} ({question.type})
                          </h5>
                          <p className="text-sm text-gray-500">
                            {question.content}
                          </p>
                          <p className="text-sm text-gray-500">
                            Points: {question.points} | Difficulty: {question.difficulty}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Add New Question</h4>
                    <QuestionForm
                      onSubmit={handleAddQuestion}
                      onCancel={() => setActiveTab('basic')}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4">
                <FormField
                  control={form.control}
                  name="securityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Level</FormLabel>
                      <Select
                        onValueChange={(value: 'STANDARD' | 'HIGH' | 'CUSTOM') => {
                          handleSecurityLevelChange(value)
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select security level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STANDARD">Standard</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CUSTOM">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the security level for this exam
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="font-medium">Security Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="blockClipboard"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Block Clipboard</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="blockKeyboardShortcuts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Block Keyboard Shortcuts</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="blockMultipleTabs"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Block Multiple Tabs</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="blockRightClick"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Block Right Click</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="blockSearchEngines"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Block Search Engines</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="browserMonitoring"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Browser Monitoring</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deviceTracking"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Device Tracking</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fullScreenMode"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Full Screen Mode</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="periodicUserValidation"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Periodic User Validation</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="screenshotBlocking"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Screenshot Blocking</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="webcamRequired"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <FormLabel>Require Webcam</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxViolations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Violations</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of security violations allowed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="resumeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resume Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of times students can resume the exam (0 for no resumes)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-x-2">
                      <div>
                        <FormLabel>Publish Exam</FormLabel>
                        <FormDescription>
                          Make this exam available to students immediately
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createExamMutation.isPending}>
                {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 