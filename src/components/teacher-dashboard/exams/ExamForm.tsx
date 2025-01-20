'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ExamFormValues } from '@/types/exam'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { QuestionForm } from '../questions/QuestionForm'
import { Card } from '@/components/ui/card'
import { SecurityLevel, DifficultyLevel } from '@prisma/client'
import { toast } from 'sonner'
import { useExamCreationStore } from '@/store/examCreation'

interface StoreQuestion {
  id: number
  content: string
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'TRUE_FALSE' | 'MATCHING' | 'CODING'
  points: number
  timeLimit?: number
  options?: Array<{
    text: string
    isCorrect?: boolean
    explanation?: string | null
  }>
}

const examSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  startTime: z.date().nullable(),
  endTime: z.date().nullable(),
  classId: z.string(),
  questions: z.array(z.object({
    content: z.string().min(1, 'Question content is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'MATCHING', 'CODING']),
    points: z.number().min(1, 'Points must be at least 1'),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
    })).optional(),
    timeLimit: z.number().min(0).optional(),
  })).min(1, 'At least one question is required'),
  securityLevel: z.nativeEnum(SecurityLevel).default(SecurityLevel.STANDARD),
  maxViolations: z.number().min(1).default(3),
  fullScreenMode: z.boolean().default(true),
  blockMultipleTabs: z.boolean().default(true),
  blockKeyboardShortcuts: z.boolean().default(true),
  blockRightClick: z.boolean().default(true),
  blockClipboard: z.boolean().default(true),
  browserMonitoring: z.boolean().default(true),
  blockSearchEngines: z.boolean().default(true),
  resumeCount: z.number().min(0).default(1),
  webcamRequired: z.boolean().default(false),
  deviceTracking: z.boolean().default(true),
  screenshotBlocking: z.boolean().default(true),
  periodicUserValidation: z.boolean().default(true),
})

interface ExamFormProps {
  onSubmit: (data: ExamFormValues) => void
  defaultValues?: Partial<ExamFormValues>
  onChange?: (data: Partial<ExamFormValues>) => void
  isLoading?: boolean
  classId: string
}

type ExamQuestion = NonNullable<ExamFormValues['questions']>[number]
type QuestionOption = { text: string; isCorrect: boolean; explanation?: string | null }
type StoreQuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'LONG_ANSWER'

// Helper function to convert store question to exam question
const convertToExamQuestion = (q: StoreQuestion): ExamQuestion => {
  const baseQuestion = {
    id: String(q.id),
    content: q.content,
    points: q.points,
    difficulty: DifficultyLevel.MEDIUM,
    explanation: null,
    timeLimit: q.timeLimit || null,
    orderIndex: q.id - 1,
  }

  switch (q.type) {
    case 'MULTIPLE_CHOICE':
      return {
        ...baseQuestion,
        type: 'MULTIPLE_CHOICE' as const,
        options: q.options?.map(opt => ({
          text: opt.text,
          isCorrect: false,
          explanation: null
        })) || []
      }
    case 'SHORT_ANSWER':
      return {
        ...baseQuestion,
        type: 'SHORT_ANSWER' as const,
        correctAnswer: ''
      }
    case 'LONG_ANSWER':
      return {
        ...baseQuestion,
        type: 'LONG_ANSWER' as const,
        rubric: null
      }
    default:
      // Default to multiple choice for unsupported types
      return {
        ...baseQuestion,
        type: 'MULTIPLE_CHOICE' as const,
        options: []
      }
  }
}

// Helper function to convert exam question to store question
const convertToStoreQuestion = (q: ExamQuestion, index: number): StoreQuestion => {
  const baseQuestion = {
    id: index + 1,
    content: q.content,
    points: q.points,
    timeLimit: q.timeLimit || undefined,
  }

  if (q.type === 'MULTIPLE_CHOICE') {
    return {
      ...baseQuestion,
      type: 'MULTIPLE_CHOICE',
      options: q.options.map(opt => ({ text: opt.text }))
    }
  }

  return {
    ...baseQuestion,
    type: q.type as StoreQuestionType,
  }
}

export function ExamForm({ onSubmit, defaultValues, onChange, isLoading, classId }: ExamFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [questions, setQuestions] = useState<StoreQuestion[]>(() => {
    const initialQuestions = defaultValues?.questions || []
    return initialQuestions.map((q, index) => convertToStoreQuestion(q, index))
  })

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      duration: defaultValues?.duration || 60,
      startTime: defaultValues?.startTime || null,
      endTime: defaultValues?.endTime || null,
      classId: classId,
      questions: questions.map(convertToExamQuestion),
      securityLevel: defaultValues?.securityLevel || SecurityLevel.STANDARD,
      maxViolations: defaultValues?.maxViolations || 3,
      fullScreenMode: defaultValues?.fullScreenMode ?? true,
      blockMultipleTabs: defaultValues?.blockMultipleTabs ?? true,
      blockKeyboardShortcuts: defaultValues?.blockKeyboardShortcuts ?? true,
      blockRightClick: defaultValues?.blockRightClick ?? true,
      blockClipboard: defaultValues?.blockClipboard ?? true,
      browserMonitoring: defaultValues?.browserMonitoring ?? true,
      blockSearchEngines: defaultValues?.blockSearchEngines ?? true,
      resumeCount: defaultValues?.resumeCount || 1,
      webcamRequired: defaultValues?.webcamRequired ?? false,
      deviceTracking: defaultValues?.deviceTracking ?? true,
      screenshotBlocking: defaultValues?.screenshotBlocking ?? true,
      periodicUserValidation: defaultValues?.periodicUserValidation ?? true,
    },
  })

  const handleSubmit = async (data: ExamFormValues) => {
    try {
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

      // Call the onSubmit prop with the form data
      await onSubmit(data)
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to save exam')
    }
  }

  const handleFieldChange = (field: keyof ExamFormValues, value: any) => {
    form.setValue(field, value)
    if (onChange) {
      onChange({
        ...form.getValues(),
        [field]: value,
      })
    }
  }

  const handleAddQuestion = (questionData: Partial<StoreQuestion>) => {
    const newQuestion: StoreQuestion = {
      id: questions.length + 1,
      content: questionData.content || '',
      type: questionData.type || 'MULTIPLE_CHOICE',
      points: questionData.points || 1,
      options: questionData.type === 'MULTIPLE_CHOICE' ? questionData.options || [{ text: '' }] : undefined,
      timeLimit: questionData.timeLimit,
    }
    
    const newQuestions = [...questions, newQuestion]
    setQuestions(newQuestions)
    
    const examQuestions = newQuestions.map(convertToExamQuestion)
    form.setValue('questions', examQuestions)
    
    if (onChange) {
      onChange({
        ...form.getValues(),
        questions: examQuestions,
      })
    }
  }

  const handleUpdateQuestion = (id: number, updates: Partial<StoreQuestion>) => {
    const newQuestions = questions.map((q: StoreQuestion) => 
      q.id === id ? { ...q, ...updates } : q
    )
    
    setQuestions(newQuestions)
    
    const examQuestions = newQuestions.map(convertToExamQuestion)
    form.setValue('questions', examQuestions)

    if (onChange) {
      onChange({
        ...form.getValues(),
        questions: examQuestions,
      })
    }
  }

  const handleRemoveQuestion = (id: number) => {
    const newQuestions = questions.filter((q: StoreQuestion) => q.id !== id)
    setQuestions(newQuestions)
    
    const examQuestions = newQuestions.map(convertToExamQuestion)
    form.setValue('questions', examQuestions)

    if (onChange) {
      onChange({
        ...form.getValues(),
        questions: examQuestions,
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="p-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleFieldChange('title', e.target.value)
                        }}
                        placeholder="Enter exam title"
                      />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e)
                          handleFieldChange('description', e.target.value)
                        }}
                        placeholder="Enter exam description" 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide additional details about the exam
                    </FormDescription>
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
                        min={1}
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          field.onChange(value)
                          handleFieldChange('duration', value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Set the time limit for the exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Time (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date: Date | undefined) => {
                              field.onChange(date || null)
                              handleFieldChange('startTime', date || null)
                            }}
                            disabled={(date: Date) => {
                              const endTime = form.getValues('endTime')
                              return date < new Date() || (endTime ? date > endTime : false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When the exam will be available
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Time (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date: Date | undefined) => {
                              field.onChange(date || null)
                              handleFieldChange('endTime', date || null)
                            }}
                            disabled={(date: Date) => {
                              const startTime = form.getValues('startTime')
                              return date < new Date() || (startTime ? date < startTime : false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When the exam will close
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card className="p-6">
            <div className="space-y-6">
              <QuestionForm
                question={{
                  id: questions.length + 1,
                  content: '',
                  type: 'MULTIPLE_CHOICE',
                  points: 1,
                  options: [{ text: '' }],
                }}
                onUpdate={handleAddQuestion}
                onRemove={() => {}}
              />
              {questions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Added Questions</h3>
                  {questions.map((question: StoreQuestion) => (
                    <div key={question.id} className="p-4 border rounded-lg mb-4">
                      <QuestionForm
                        question={question}
                        onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
                        onRemove={() => handleRemoveQuestion(question.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="securityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Level</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 border rounded"
                        onChange={(e) => {
                          field.onChange(e)
                          handleFieldChange('securityLevel', e.target.value)
                        }}
                      >
                        {Object.values(SecurityLevel).map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxViolations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Violations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          field.onChange(value)
                          handleFieldChange('maxViolations', value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {[
                { name: 'fullScreenMode', label: 'Full Screen Mode' },
                { name: 'blockMultipleTabs', label: 'Block Multiple Tabs' },
                { name: 'blockKeyboardShortcuts', label: 'Block Keyboard Shortcuts' },
                { name: 'blockRightClick', label: 'Block Right Click' },
                { name: 'blockClipboard', label: 'Block Clipboard' },
                { name: 'browserMonitoring', label: 'Browser Monitoring' },
                { name: 'blockSearchEngines', label: 'Block Search Engines' },
                { name: 'webcamRequired', label: 'Webcam Required' },
                { name: 'deviceTracking', label: 'Device Tracking' },
                { name: 'screenshotBlocking', label: 'Screenshot Blocking' },
                { name: 'periodicUserValidation', label: 'Periodic User Validation' },
              ].map(({ name, label }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as any}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <FormLabel>{label}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            handleFieldChange(name as any, checked)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          className="w-full sm:w-auto"
          size="lg"
          onClick={async () => {
            try {
              // Validate form data
              const values = form.getValues()
              const result = examSchema.safeParse(values)
              
              if (!result.success) {
                // Show first validation error
                const firstError = result.error.errors[0]
                toast.error(firstError.message)
                
                // Switch to the appropriate tab based on the error
                if (firstError.path[0] === 'title' || firstError.path[0] === 'duration') {
                  setActiveTab('basic')
                } else if (firstError.path[0] === 'questions') {
                  setActiveTab('questions')
                } else if (firstError.path[0] === 'securityLevel') {
                  setActiveTab('security')
                }
                return
              }

              // Show loading state
              toast.loading('Creating exam...')

              // Submit form data
              await onSubmit(values)

              // Show success message
              toast.success('Exam created successfully!')

            } catch (error) {
              // Show error message
              console.error('Error creating exam:', error)
              toast.error(error instanceof Error ? error.message : 'Failed to create exam')
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Exam...
            </>
          ) : (
            'Save and Create Exam'
          )}
        </Button>
      </div>
    </div>
  )
}
