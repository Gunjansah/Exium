'use client'

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
import { CalendarIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { QuestionForm } from './QuestionForm'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { SecurityLevel } from '@prisma/client'
import { Loader2 } from 'lucide-react'

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

export function ExamForm({ onSubmit, defaultValues, onChange, isLoading, classId }: ExamFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [questions, setQuestions] = useState<any[]>([])

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      duration: defaultValues?.duration || 60,
      startTime: defaultValues?.startTime || null,
      endTime: defaultValues?.endTime || null,
      classId: classId,
      questions: defaultValues?.questions || [],
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
      console.log('Form data before submission:', data)
      
      // Validate questions
      if (questions.length === 0) {
        form.setError('questions', {
          type: 'manual',
          message: 'At least one question is required'
        })
        setActiveTab('questions')
        return
      }

      // Prepare the exam data according to the schema
      const examData = {
        ...data,
        classId,
        questions: questions.map((q, index) => ({
          ...q,
          orderIndex: index,
          // Ensure question data matches schema
          type: q.type,
          content: q.content,
          points: q.points,
          difficulty: q.difficulty,
          explanation: q.explanation,
          timeLimit: q.timeLimit,
          // Handle specific question types
          ...(q.type === 'MULTIPLE_CHOICE' && {
            options: JSON.stringify(q.options)
          }),
          ...(q.type === 'MATCHING' && {
            options: JSON.stringify(q.matchingPairs)
          }),
          ...(q.type === 'CODING' && {
            codeTemplate: q.codeTemplate,
            testCases: JSON.stringify(q.testCases)
          }),
          ...(q.type === 'SHORT_ANSWER' && {
            correctAnswer: q.correctAnswer
          }),
          ...(q.type === 'LONG_ANSWER' && {
            rubric: q.rubric
          }),
          ...(q.type === 'TRUE_FALSE' && {
            correctAnswer: q.correctAnswer
          })
        }))
      }

      console.log('Submitting exam data:', examData)
      await onSubmit(examData)
    } catch (error) {
      console.error('Error submitting exam form:', error)
      throw error
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

  const handleAddQuestion = (question: any) => {
    const updatedQuestions = [...questions, question]
    setQuestions(updatedQuestions)
    // Also update the form's questions field
    form.setValue('questions', updatedQuestions)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                <QuestionForm onSubmit={handleAddQuestion} />
                {questions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Added Questions</h3>
                    {questions.map((question, index) => (
                      <div key={index} className="p-4 border rounded-lg mb-4">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        <p>{question.content}</p>
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

        <div className="flex justify-end mt-6">
          <Button 
            type="submit" 
            disabled={isLoading || questions.length === 0}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save and Create Exam'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
