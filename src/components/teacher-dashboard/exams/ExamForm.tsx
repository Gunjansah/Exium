'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExamSecuritySettings } from './ExamSecuritySettings'
import { CreateExamRequest } from '@/types/exam'
import { SecurityLevel } from '@prisma/client'
import { QuestionForm } from '../questions/QuestionForm'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { QuestionCard } from '../questions/QuestionCard'

const questionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'MATCHING', 'CODING']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  points: z.number().min(1),
  content: z.string().min(1, 'Question content is required'),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  timeLimit: z.number().min(0).optional(),
  options: z.array(z.string()).optional(),
  codeTemplate: z.string().optional(),
  testCases: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      isHidden: z.boolean(),
    })
  ).optional(),
})

const examFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  startTime: z.date().nullable().optional(),
  endTime: z.date().nullable().optional(),
  classId: z.string().min(1, 'Class ID is required'),
  questions: z.array(questionSchema).optional(),
  // Security Settings
  securityLevel: z.nativeEnum(SecurityLevel).optional(),
  maxViolations: z.coerce.number().min(1).optional(),
  // Security Features
  fullScreenMode: z.boolean().optional(),
  blockMultipleTabs: z.boolean().optional(),
  blockKeyboardShortcuts: z.boolean().optional(),
  blockRightClick: z.boolean().optional(),
  blockClipboard: z.boolean().optional(),
  browserMonitoring: z.boolean().optional(),
  blockSearchEngines: z.boolean().optional(),
  resumeCount: z.coerce.number().min(0).optional(),
  webcamRequired: z.boolean().optional(),
  deviceTracking: z.boolean().optional(),
  screenshotBlocking: z.boolean().optional(),
  periodicUserValidation: z.boolean().optional(),
}) satisfies z.ZodType<CreateExamRequest>

type FormSchema = z.infer<typeof examFormSchema>

interface ExamFormProps {
  defaultValues?: Partial<FormSchema>
  onSubmit: (data: CreateExamRequest) => void
  isLoading?: boolean
}

export function ExamForm({ onSubmit, isLoading, defaultValues }: ExamFormProps) {
  const [questions, setQuestions] = useState<z.infer<typeof questionSchema>[]>([])
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  const form = useForm<FormSchema>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      duration: defaultValues?.duration ?? 60,
      startTime: defaultValues?.startTime ?? null,
      endTime: defaultValues?.endTime ?? null,
      classId: defaultValues?.classId ?? '',
      questions: defaultValues?.questions ?? [],
      securityLevel: defaultValues?.securityLevel ?? SecurityLevel.STANDARD,
      maxViolations: defaultValues?.maxViolations ?? 3,
      fullScreenMode: defaultValues?.fullScreenMode ?? false,
      blockMultipleTabs: defaultValues?.blockMultipleTabs ?? false,
      blockKeyboardShortcuts: defaultValues?.blockKeyboardShortcuts ?? false,
      blockRightClick: defaultValues?.blockRightClick ?? false,
      blockClipboard: defaultValues?.blockClipboard ?? false,
      browserMonitoring: defaultValues?.browserMonitoring ?? false,
      blockSearchEngines: defaultValues?.blockSearchEngines ?? false,
      resumeCount: defaultValues?.resumeCount ?? 0,
      webcamRequired: defaultValues?.webcamRequired ?? false,
      deviceTracking: defaultValues?.deviceTracking ?? false,
      screenshotBlocking: defaultValues?.screenshotBlocking ?? false,
      periodicUserValidation: defaultValues?.periodicUserValidation ?? false,
    },
  })

  const handleSubmit = (data: FormSchema) => {
    onSubmit({
      ...data,
      questions: questions,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter exam title" {...field} />
                      </FormControl>
                      <FormDescription>
                        The title of your exam that students will see
                      </FormDescription>
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
                        <Textarea
                          placeholder="Enter exam description"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description or instructions for students
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
                          placeholder="Enter exam duration"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        How long students have to complete the exam
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter class ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        The ID of the class this exam belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>When the exam becomes available</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormDescription>When the exam closes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <QuestionCard
                        key={index}
                        question={{ ...question, id: `temp-${index}`, orderIndex: index }}
                        onEdit={() => {
                          const newQuestions = [...questions]
                          newQuestions.splice(index, 1)
                          setQuestions(newQuestions)
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No questions added yet</p>
                  </div>
                )}

                {isAddingQuestion ? (
                  <QuestionForm
                    onSubmit={(data) => {
                      setQuestions([...questions, data])
                      setIsAddingQuestion(false)
                    }}
                    onCancel={() => setIsAddingQuestion(false)}
                  />
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsAddingQuestion(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <ExamSecuritySettings form={form} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Exam'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
