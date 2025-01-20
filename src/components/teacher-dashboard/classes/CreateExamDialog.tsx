'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useCreateExam } from '@/hooks/use-exams'
import { useQueryClient } from '@tanstack/react-query'
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
import { useExamCreationStore } from '@/store/examCreation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'

interface CreateExamDialogProps {
  classId: string
  trigger?: React.ReactNode
}

const examFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.coerce.number().min(0, 'Duration must be positive'),
  questions: z.array(z.object({
    id: z.number(),
    content: z.string().min(1, 'Question content is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER']),
    points: z.coerce.number().min(1, 'Points must be at least 1'),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
    })).optional(),
    timeLimit: z.coerce.number().min(0).optional(),
  })).min(1, 'At least one question is required'),
  // Security settings
  blockClipboard: z.boolean().default(false),
  blockKeyboardShortcuts: z.boolean().default(false),
  blockMultipleTabs: z.boolean().default(false),
  blockRightClick: z.boolean().default(false),
  blockSearchEngines: z.boolean().default(false),
  browserMonitoring: z.boolean().default(false),
  deviceTracking: z.boolean().default(false),
  fullScreenMode: z.boolean().default(false),
  maxViolations: z.coerce.number().min(1).default(3),
  periodicUserValidation: z.boolean().default(false),
  resumeCount: z.coerce.number().min(0).default(0),
  screenshotBlocking: z.boolean().default(false),
  webcamRequired: z.boolean().default(false),
})

type ExamFormValues = z.infer<typeof examFormSchema>

export function CreateExamDialog({ classId, trigger }: CreateExamDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const queryClient = useQueryClient()
  const router = useRouter()
  
  const { mutate: createExam, isLoading } = useCreateExam(classId)

  const {
    metadata,
    questions,
    securitySettings,
    setMetadata,
    addQuestion,
    updateQuestion,
    removeQuestion,
    setSecuritySettings,
    clearStore
  } = useExamCreationStore()

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: metadata.title || '',
      description: metadata.description || '',
      duration: metadata.duration || 60,
      questions: questions || [],
      blockClipboard: securitySettings.blockClipboard || false,
      blockKeyboardShortcuts: securitySettings.blockKeyboardShortcuts || false,
      blockMultipleTabs: securitySettings.blockMultipleTabs || false,
      blockRightClick: securitySettings.blockRightClick || false,
      blockSearchEngines: securitySettings.blockSearchEngines || false,
      browserMonitoring: securitySettings.browserMonitoring || false,
      deviceTracking: securitySettings.deviceTracking || false,
      fullScreenMode: securitySettings.fullScreenMode || false,
      maxViolations: securitySettings.maxViolations || 3,
      periodicUserValidation: securitySettings.periodicUserValidation || false,
      resumeCount: securitySettings.resumeCount || 0,
      screenshotBlocking: securitySettings.screenshotBlocking || false,
      webcamRequired: securitySettings.webcamRequired || false,
    },
  })

  const handleSubmit = async (data: ExamFormValues) => {
    try {
      console.log('Form submitted with data:', data)
      
      // Basic validation
      if (!data.title?.trim()) {
        toast.error('Title is required')
        setActiveTab('basic')
        return
      }

      if (!data.questions || data.questions.length === 0) {
        toast.error('Please add at least one question')
        setActiveTab('questions')
        return
      }

      // Validate questions
      for (const question of data.questions) {
        if (!question.content?.trim()) {
          toast.error('All questions must have content')
          setActiveTab('questions')
          return
        }

        if (question.type === 'MULTIPLE_CHOICE') {
          if (!question.options || question.options.length < 2) {
            toast.error('Multiple choice questions must have at least 2 options')
            setActiveTab('questions')
            return
          }

          if (question.options.some(opt => !opt.text?.trim())) {
            toast.error('All options must have text')
            setActiveTab('questions')
            return
          }
        }
      }

      // Create exam using the mutation
      createExam({
        metadata: {
          title: data.title.trim(),
          description: data.description?.trim(),
          duration: Number(data.duration),
          classId: classId,
        },
        questions: data.questions.map((q, index) => ({
          ...q,
          content: q.content.trim(),
          points: Number(q.points),
          timeLimit: q.timeLimit ? Number(q.timeLimit) : undefined,
          orderIndex: index,
          options: q.type === 'MULTIPLE_CHOICE' ? q.options?.map(opt => ({
            text: opt.text.trim()
          })) : undefined
        })),
        securitySettings: {
          blockClipboard: Boolean(data.blockClipboard),
          blockKeyboardShortcuts: Boolean(data.blockKeyboardShortcuts),
          blockMultipleTabs: Boolean(data.blockMultipleTabs),
          blockRightClick: Boolean(data.blockRightClick),
          blockSearchEngines: Boolean(data.blockSearchEngines),
          browserMonitoring: Boolean(data.browserMonitoring),
          deviceTracking: Boolean(data.deviceTracking),
          fullScreenMode: Boolean(data.fullScreenMode),
          maxViolations: Number(data.maxViolations),
          periodicUserValidation: Boolean(data.periodicUserValidation),
          resumeCount: Number(data.resumeCount),
          screenshotBlocking: Boolean(data.screenshotBlocking),
          webcamRequired: Boolean(data.webcamRequired),
        }
      }, {
        onSuccess: () => {
          toast.success('Exam created successfully')
          setOpen(false)
          clearStore()
          form.reset()
          router.push('/teacher/exams')
        },
        onError: (error) => {
          console.error('Error creating exam:', error)
          toast.error(error instanceof Error ? error.message : 'Failed to create exam')
        }
      })
    } catch (error) {
      console.error('Error in form submission:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create exam')
    }
  }

  const handleAddQuestion = () => {
    addQuestion({
      content: '',
      type: 'MULTIPLE_CHOICE',
      points: 1,
      options: [{ text: '' }],
    })
  }

  const handleRemoveQuestion = (id: number) => {
    removeQuestion(id)
  }

  const handleUpdateQuestion = (id: number, updates: Partial<ExamFormValues['questions'][0]>) => {
    updateQuestion(id, updates)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        clearStore()
        form.reset()
      }
    }}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Exam</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Create a new exam for your class. Add questions and configure security settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} onChange={(e) => {
                          field.onChange(e)
                          setMetadata({ title: e.target.value })
                        }} />
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
                        <Textarea {...field} onChange={(e) => {
                          field.onChange(e)
                          setMetadata({ description: e.target.value })
                        }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value)
                            field.onChange(value)
                            setMetadata({ duration: value })
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="questions" className="space-y-4">
                <div className="space-y-4">
                  {questions.map((question) => (
                    <div key={question.id} className="p-4 border rounded-lg">
                      <QuestionForm
                        question={question}
                        onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
                        onRemove={() => handleRemoveQuestion(question.id)}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                  >
                    Add Question
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                {Object.entries(securitySettings).map(([key, value]) => {
                  const isBoolean = typeof value === 'boolean'
                  return (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key as keyof typeof securitySettings}
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>{key.replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                            <FormDescription>
                              {isBoolean
                                ? `Enable/disable ${key.toLowerCase().replace(/([A-Z])/g, ' $1').trim()}`
                                : `Set ${key.toLowerCase().replace(/([A-Z])/g, ' $1').trim()}`}
                            </FormDescription>
                          </div>
                          <FormControl>
                            {isBoolean ? (
                              <Switch
                                checked={field.value as boolean}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  setSecuritySettings({ [key]: checked })
                                }}
                              />
                            ) : (
                              <Input
                                type="number"
                                value={field.value as number}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value)
                                  field.onChange(value)
                                  setSecuritySettings({ [key]: value })
                                }}
                                className="w-24"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                })}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  clearStore()
                  form.reset()
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Creating...' : 'Save and Create Exam'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 