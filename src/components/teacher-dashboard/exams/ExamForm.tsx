'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { QuestionType, DifficultyLevel, SecurityLevel } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'

const questionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(QuestionType.MULTIPLE_CHOICE),
    content: z.string().min(1, 'Question content is required'),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    options: z.array(z.object({
      text: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
    })).min(2, 'At least 2 options are required'),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.SHORT_ANSWER),
    content: z.string().min(1, 'Question content is required'),
  points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    correctAnswer: z.string().min(1, 'Correct answer is required'),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.LONG_ANSWER),
  content: z.string().min(1, 'Question content is required'),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
  correctAnswer: z.string().optional(),
    rubric: z.string().optional(),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.TRUE_FALSE),
    content: z.string().min(1, 'Question content is required'),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    correctAnswer: z.enum(['true', 'false']),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.MATCHING),
    content: z.string().min(1, 'Question content is required'),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
    explanation: z.string().optional(),
    timeLimit: z.number().min(0).optional(),
    matchingPairs: z.array(z.object({
      left: z.string().min(1, 'Left side is required'),
      right: z.string().min(1, 'Right side is required'),
    })).min(2, 'At least 2 pairs are required'),
    orderIndex: z.number(),
  }),
  z.object({
    type: z.literal(QuestionType.CODING),
    content: z.string().min(1, 'Question content is required'),
    points: z.number().min(1),
    difficulty: z.nativeEnum(DifficultyLevel),
  explanation: z.string().optional(),
  timeLimit: z.number().min(0).optional(),
  codeTemplate: z.string().optional(),
    programmingLanguage: z.string().min(1, 'Programming language is required'),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string().min(1, 'Expected output is required'),
      isHidden: z.boolean(),
      explanation: z.string().optional(),
    })).min(1, 'At least 1 test case is required'),
    orderIndex: z.number(),
  }),
])

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  classId: z.string().min(1, 'Class ID is required'),
  questions: z.array(questionSchema),
  // Security Settings
  securityLevel: z.nativeEnum(SecurityLevel).optional(),
  maxViolations: z.number().min(1).optional(),
  // Security Features
  fullScreenMode: z.boolean().optional(),
  blockMultipleTabs: z.boolean().optional(),
  blockKeyboardShortcuts: z.boolean().optional(),
  blockRightClick: z.boolean().optional(),
  blockClipboard: z.boolean().optional(),
  browserMonitoring: z.boolean().optional(),
  blockSearchEngines: z.boolean().optional(),
  resumeCount: z.number().min(0).optional(),
  webcamRequired: z.boolean().optional(),
  deviceTracking: z.boolean().optional(),
  screenshotBlocking: z.boolean().optional(),
  periodicUserValidation: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ExamFormProps {
  onSubmit: (values: FormValues) => Promise<void>
  initialData?: {
    id: string
    title: string
    description: string | null
    duration: number
    startTime: string | null
    endTime: string | null
    classId: string
    questions: any[]
    securityLevel: SecurityLevel
    maxViolations: number
    fullScreenMode: boolean
    blockMultipleTabs: boolean
    blockKeyboardShortcuts: boolean
    blockRightClick: boolean
    blockClipboard: boolean
    browserMonitoring: boolean
    blockSearchEngines: boolean
    resumeCount: number
    webcamRequired: boolean
    deviceTracking: boolean
    screenshotBlocking: boolean
    periodicUserValidation: boolean
  }
}

export function ExamForm({ onSubmit, initialData }: ExamFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('details')
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      duration: 60,
      questions: [],
      securityLevel: SecurityLevel.STANDARD,
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
    },
  })

  const { fields: questions, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'questions',
  })

  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/teacher/classes')
        if (!response.ok) {
          throw new Error('Failed to fetch classes')
        }
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch classes')
        }
        console.log('fetched classes', data)
        return data.data || [] // Ensure we always return an array
      } catch (error) {
        console.error('Error fetching classes:', error)
        throw error
      }
    }
  })

  const addQuestion = () => {
    const baseQuestion = {
      content: '',
      points: 1,
      difficulty: DifficultyLevel.MEDIUM,
      explanation: '',
      timeLimit: 0,
      orderIndex: questions.length,
    }

    let questionData: z.infer<typeof questionSchema>

    switch (selectedQuestionType) {
      case QuestionType.MULTIPLE_CHOICE:
        questionData = {
          ...baseQuestion,
          type: QuestionType.MULTIPLE_CHOICE,
          options: [
            { text: '', isCorrect: false, explanation: '' },
            { text: '', isCorrect: false, explanation: '' },
          ],
        } as const
        break

      case QuestionType.SHORT_ANSWER:
        questionData = {
          ...baseQuestion,
          type: QuestionType.SHORT_ANSWER,
          correctAnswer: '',
        } as const
        break

      case QuestionType.LONG_ANSWER:
        questionData = {
          ...baseQuestion,
          type: QuestionType.LONG_ANSWER,
          correctAnswer: '',
          rubric: '',
        } as const
        break

      case QuestionType.TRUE_FALSE:
        questionData = {
          ...baseQuestion,
          type: QuestionType.TRUE_FALSE,
          correctAnswer: 'true',
        } as const
        break

      case QuestionType.MATCHING:
        questionData = {
          ...baseQuestion,
          type: QuestionType.MATCHING,
          matchingPairs: [
            { left: '', right: '' },
            { left: '', right: '' },
          ],
        } as const
        break

      case QuestionType.CODING:
        questionData = {
          ...baseQuestion,
          type: QuestionType.CODING,
          codeTemplate: '',
          programmingLanguage: 'javascript',
          testCases: [
            {
              input: '',
              expectedOutput: '',
              isHidden: false,
              explanation: '',
            },
          ],
        } as const
        break

      default:
        return
    }

    append(questionData)
  }

  const renderQuestionFields = (question: any, index: number) => {
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Label>Question Content</Label>
              <Textarea {...form.register(`questions.${index}.content`)} />
              {form.formState.errors.questions?.[index]?.content && (
                <p className="text-sm text-red-500">{form.formState.errors.questions[index]?.content?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input type="number" {...form.register(`questions.${index}.points`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  onValueChange={(value) => form.setValue(`questions.${index}.difficulty`, value as DifficultyLevel)}
                  defaultValue={question.difficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DifficultyLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Options</Label>
              {question.options.map((option: any, optionIndex: number) => (
                <div key={optionIndex} className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Input {...form.register(`questions.${index}.options.${optionIndex}.text`)} placeholder="Option text" />
                    <Switch
                      checked={option.isCorrect}
                      onCheckedChange={(checked) =>
                        form.setValue(`questions.${index}.options.${optionIndex}.isCorrect`, checked)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const options = [...question.options]
                        options.splice(optionIndex, 1)
                        form.setValue(`questions.${index}.options`, options)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    {...form.register(`questions.${index}.options.${optionIndex}.explanation`)}
                    placeholder="Option explanation (optional)"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.setValue(`questions.${index}.options`, [
                    ...question.options,
                    { text: '', isCorrect: false, explanation: '' },
                  ])
                }
              >
                Add Option
              </Button>
            </div>

            <div className="grid gap-4">
              <Label>Explanation</Label>
              <Textarea {...form.register(`questions.${index}.explanation`)} placeholder="Optional explanation" />
            </div>
          </div>
        )

      case QuestionType.SHORT_ANSWER:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Label>Question Content</Label>
              <Textarea {...form.register(`questions.${index}.content`)} />
              {form.formState.errors.questions?.[index]?.content && (
                <p className="text-sm text-red-500">{form.formState.errors.questions[index]?.content?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input type="number" {...form.register(`questions.${index}.points`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  onValueChange={(value) => form.setValue(`questions.${index}.difficulty`, value as DifficultyLevel)}
                  defaultValue={question.difficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DifficultyLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              <Label>Correct Answer</Label>
              <Input {...form.register(`questions.${index}.correctAnswer`)} />
              {form.formState.errors.questions?.[index] && (
                <p className="text-sm text-red-500">
                  {(form.formState.errors.questions[index] as any)?.correctAnswer?.message}
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <Label>Explanation</Label>
              <Textarea {...form.register(`questions.${index}.explanation`)} placeholder="Optional explanation" />
            </div>
          </div>
        )

      case QuestionType.LONG_ANSWER:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Label>Question Content</Label>
              <Textarea {...form.register(`questions.${index}.content`)} />
              {form.formState.errors.questions?.[index]?.content && (
                <p className="text-sm text-red-500">{form.formState.errors.questions[index]?.content?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input type="number" {...form.register(`questions.${index}.points`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  onValueChange={(value) => form.setValue(`questions.${index}.difficulty`, value as DifficultyLevel)}
                  defaultValue={question.difficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DifficultyLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              <Label>Sample Answer (Optional)</Label>
              <Textarea {...form.register(`questions.${index}.correctAnswer`)} />
            </div>

            <div className="grid gap-4">
              <Label>Rubric</Label>
              <Textarea {...form.register(`questions.${index}.rubric`)} placeholder="Grading rubric" />
            </div>

            <div className="grid gap-4">
              <Label>Explanation</Label>
              <Textarea {...form.register(`questions.${index}.explanation`)} placeholder="Optional explanation" />
            </div>
          </div>
        )

      case QuestionType.TRUE_FALSE:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Label>Question Content</Label>
              <Textarea {...form.register(`questions.${index}.content`)} />
              {form.formState.errors.questions?.[index]?.content && (
                <p className="text-sm text-red-500">{form.formState.errors.questions[index]?.content?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input type="number" {...form.register(`questions.${index}.points`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  onValueChange={(value) => form.setValue(`questions.${index}.difficulty`, value as DifficultyLevel)}
                  defaultValue={question.difficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DifficultyLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              <Label>Correct Answer</Label>
              <Select
                onValueChange={(value) => form.setValue(`questions.${index}.correctAnswer`, value)}
                defaultValue={question.correctAnswer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              <Label>Explanation</Label>
              <Textarea {...form.register(`questions.${index}.explanation`)} placeholder="Optional explanation" />
            </div>
          </div>
        )

      case QuestionType.MATCHING:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Label>Question Content</Label>
              <Textarea {...form.register(`questions.${index}.content`)} />
              {form.formState.errors.questions?.[index]?.content && (
                <p className="text-sm text-red-500">{form.formState.errors.questions[index]?.content?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input type="number" {...form.register(`questions.${index}.points`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  onValueChange={(value) => form.setValue(`questions.${index}.difficulty`, value as DifficultyLevel)}
                  defaultValue={question.difficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DifficultyLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Matching Pairs</Label>
              {question.matchingPairs.map((pair: any, pairIndex: number) => (
                <div key={pairIndex} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Input {...form.register(`questions.${index}.matchingPairs.${pairIndex}.left`)} placeholder="Left side" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input {...form.register(`questions.${index}.matchingPairs.${pairIndex}.right`)} placeholder="Right side" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const pairs = [...question.matchingPairs]
                        pairs.splice(pairIndex, 1)
                        form.setValue(`questions.${index}.matchingPairs`, pairs)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.setValue(`questions.${index}.matchingPairs`, [
                    ...question.matchingPairs,
                    { left: '', right: '' },
                  ])
                }
              >
                Add Pair
              </Button>
            </div>

            <div className="grid gap-4">
              <Label>Explanation</Label>
              <Textarea {...form.register(`questions.${index}.explanation`)} placeholder="Optional explanation" />
            </div>
          </div>
        )

      case QuestionType.CODING:
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <Label>Question Content</Label>
              <Textarea {...form.register(`questions.${index}.content`)} />
              {form.formState.errors.questions?.[index]?.content && (
                <p className="text-sm text-red-500">{form.formState.errors.questions[index]?.content?.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input type="number" {...form.register(`questions.${index}.points`, { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  onValueChange={(value) => form.setValue(`questions.${index}.difficulty`, value as DifficultyLevel)}
                  defaultValue={question.difficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DifficultyLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              <Label>Programming Language</Label>
              <Input {...form.register(`questions.${index}.programmingLanguage`)} />
            </div>

            <div className="grid gap-4">
              <Label>Code Template (Optional)</Label>
              <Textarea {...form.register(`questions.${index}.codeTemplate`)} placeholder="Initial code template" />
            </div>

            <div className="space-y-4">
              <Label>Test Cases</Label>
              {question.testCases.map((testCase: any, testCaseIndex: number) => (
                <Card key={testCaseIndex} className="p-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Input</Label>
                        <Input {...form.register(`questions.${index}.testCases.${testCaseIndex}.input`)} />
                      </div>
                      <div>
                        <Label>Expected Output</Label>
                        <Input {...form.register(`questions.${index}.testCases.${testCaseIndex}.expectedOutput`)} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={testCase.isHidden}
                          onCheckedChange={(checked) =>
                            form.setValue(`questions.${index}.testCases.${testCaseIndex}.isHidden`, checked)
                          }
                        />
                        <Label>Hidden Test Case</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const testCases = [...question.testCases]
                          testCases.splice(testCaseIndex, 1)
                          form.setValue(`questions.${index}.testCases`, testCases)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Explanation</Label>
                      <Input
                        {...form.register(`questions.${index}.testCases.${testCaseIndex}.explanation`)}
                        placeholder="Test case explanation"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.setValue(`questions.${index}.testCases`, [
                    ...question.testCases,
                    {
                      input: '',
                      expectedOutput: '',
                      isHidden: false,
                      explanation: '',
                    },
                  ])
                }
              >
                Add Test Case
              </Button>
            </div>

            <div className="grid gap-4">
              <Label>Explanation</Label>
              <Textarea {...form.register(`questions.${index}.explanation`)} placeholder="Optional explanation" />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values)
      
      // Invalidate and refetch all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['exams'] }),
        queryClient.invalidateQueries({ queryKey: ['classes'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['class-exams'] }),
        queryClient.invalidateQueries({ queryKey: ['exam-details'] }),
        queryClient.invalidateQueries({ queryKey: ['exam-enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['exam-submissions'] }),
      ])

      // Force a router refresh to update server components
      router.refresh()

      toast({
        title: `Exam ${initialData ? 'updated' : 'created'} successfully`,
        description: "All changes have been saved and synced.",
      })

      if (!initialData) {
        // Redirect to the exam page after creation
        router.push('/teacher/exams')
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save exam. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Exam Details</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>Title</Label>
              <Input {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" {...form.register('duration', { valueAsNumber: true })} />
                {form.formState.errors.duration && (
                  <p className="text-sm text-red-500">{form.formState.errors.duration.message}</p>
                )}
              </div>

              <div>
                <Label>Class</Label>
                <Select
                  onValueChange={(value) => form.setValue('classId', value)}
                  defaultValue={initialData?.classId}
                  disabled={isLoadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClasses ? "Loading..." : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(classes) ? classes : []).map((class_: any) => (
                      <SelectItem key={class_.id} value={class_.id}>
                        {class_.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.classId && (
                  <p className="text-sm text-red-500">{form.formState.errors.classId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="datetime-local" {...form.register('startTime')} />
              </div>

              <div>
                <Label>End Time</Label>
                <Input type="datetime-local" {...form.register('endTime')} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={selectedQuestionType}
              onValueChange={(value) => setSelectedQuestionType(value as QuestionType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(QuestionType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>

          <ScrollArea className="h-[600px]">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => index > 0 && move(index, index - 1)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => index < questions.length - 1 && move(index, index + 1)}
                      disabled={index === questions.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {renderQuestionFields(question, index)}
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>Security Level</Label>
              <Select
                onValueChange={(value) => form.setValue('securityLevel', value as SecurityLevel)}
                defaultValue={form.getValues('securityLevel')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select security level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SecurityLevel).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Maximum Violations</Label>
              <Input
                type="number"
                {...form.register('maxViolations', { valueAsNumber: true })}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Full Screen Mode</Label>
                <Switch
                  checked={form.watch('fullScreenMode')}
                  onCheckedChange={(checked) => form.setValue('fullScreenMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Block Multiple Tabs</Label>
                <Switch
                  checked={form.watch('blockMultipleTabs')}
                  onCheckedChange={(checked) => form.setValue('blockMultipleTabs', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Block Keyboard Shortcuts</Label>
                <Switch
                  checked={form.watch('blockKeyboardShortcuts')}
                  onCheckedChange={(checked) => form.setValue('blockKeyboardShortcuts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Block Right Click</Label>
                <Switch
                  checked={form.watch('blockRightClick')}
                  onCheckedChange={(checked) => form.setValue('blockRightClick', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Block Clipboard</Label>
                <Switch
                  checked={form.watch('blockClipboard')}
                  onCheckedChange={(checked) => form.setValue('blockClipboard', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Browser Monitoring</Label>
                <Switch
                  checked={form.watch('browserMonitoring')}
                  onCheckedChange={(checked) => form.setValue('browserMonitoring', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Block Search Engines</Label>
                <Switch
                  checked={form.watch('blockSearchEngines')}
                  onCheckedChange={(checked) => form.setValue('blockSearchEngines', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Webcam Required</Label>
                <Switch
                  checked={form.watch('webcamRequired')}
                  onCheckedChange={(checked) => form.setValue('webcamRequired', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Device Tracking</Label>
                <Switch
                  checked={form.watch('deviceTracking')}
                  onCheckedChange={(checked) => form.setValue('deviceTracking', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Screenshot Blocking</Label>
                <Switch
                  checked={form.watch('screenshotBlocking')}
                  onCheckedChange={(checked) => form.setValue('screenshotBlocking', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Periodic User Validation</Label>
                <Switch
                  checked={form.watch('periodicUserValidation')}
                  onCheckedChange={(checked) => form.setValue('periodicUserValidation', checked)}
                />
              </div>
            </div>

            <div>
              <Label>Resume Count</Label>
                        <Input
                          type="number"
                {...form.register('resumeCount', { valueAsNumber: true })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{form.watch('title')}</h2>
            {form.watch('description') && (
              <p className="text-gray-600 mb-4">{form.watch('description')}</p>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="font-semibold">Duration:</span> {form.watch('duration')} minutes
              </div>
              {form.watch('startTime') && (
                <div>
                  <span className="font-semibold">Start Time:</span>{' '}
                  {(() => {
                    const startTime = form.watch('startTime')
                    return startTime ? new Date(startTime).toLocaleString() : ''
                  })()}
                </div>
              )}
              {form.watch('endTime') && (
                <div>
                  <span className="font-semibold">End Time:</span>{' '}
                  {(() => {
                    const endTime = form.watch('endTime')
                    return endTime ? new Date(endTime).toLocaleString() : ''
                  })()}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <ScrollArea className="h-[500px]">
              {questions.map((question, index) => (
                <Card key={question.id} className="p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Question {index + 1} ({question.points} points)
                  </h3>
                  <p className="mb-4">{question.content}</p>

                  {question.type === QuestionType.MULTIPLE_CHOICE && (
                    <div className="space-y-2">
                      {question.options.map((option: any, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`preview-question-${index}`}
                            disabled
                          />
                          <span>{option.text}</span>
                          {option.explanation && (
                            <span className="text-sm text-gray-500">({option.explanation})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === QuestionType.SHORT_ANSWER && (
                    <div className="space-y-2">
                      <Input disabled placeholder="Enter your answer" />
                      <div className="text-sm text-gray-500">
                        <span className="font-semibold">Correct Answer:</span> {question.correctAnswer}
                      </div>
                    </div>
                  )}

                  {question.type === QuestionType.LONG_ANSWER && (
                    <div className="space-y-2">
                      <Textarea disabled placeholder="Enter your answer" />
                      {question.correctAnswer && (
                        <div className="text-sm text-gray-500">
                          <span className="font-semibold">Sample Answer:</span> {question.correctAnswer}
                        </div>
                      )}
                      {question.rubric && (
                        <div className="text-sm text-gray-500">
                          <span className="font-semibold">Rubric:</span> {question.rubric}
                        </div>
                      )}
                    </div>
                  )}

                  {question.type === QuestionType.TRUE_FALSE && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`preview-question-${index}`}
                            value="true"
                            disabled
                          />
                          <span>True</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`preview-question-${index}`}
                            value="false"
                            disabled
                          />
                          <span>False</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-semibold">Correct Answer:</span>{' '}
                        {question.correctAnswer === 'true' ? 'True' : 'False'}
                      </div>
                    </div>
                  )}

                  {question.type === QuestionType.MATCHING && (
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="font-semibold">Items</div>
                          {question.matchingPairs.map((pair: any, pairIndex: number) => (
                            <div key={pairIndex} className="p-2 border rounded">
                              {pair.left}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold">Matches</div>
                          {question.matchingPairs.map((pair: any, pairIndex: number) => (
                            <div key={pairIndex} className="p-2 border rounded">
                              {pair.right}
                            </div>
                    ))}
                  </div>
                      </div>
                    </div>
                  )}

                  {question.type === QuestionType.CODING && (
                    <div className="space-y-4">
                      {question.codeTemplate && (
                        <div className="space-y-2">
                          <div className="font-semibold">Initial Code</div>
                          <pre className="p-4 bg-gray-100 rounded overflow-x-auto">
                            <code>{question.codeTemplate}</code>
                          </pre>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="font-semibold">Test Cases</div>
                        {question.testCases
                          .filter((testCase: any) => !testCase.isHidden)
                          .map((testCase: any, testCaseIndex: number) => (
                            <div key={testCaseIndex} className="p-4 border rounded space-y-2">
                              <div>
                                <span className="font-semibold">Input:</span> {testCase.input || '(empty)'}
                              </div>
                              <div>
                                <span className="font-semibold">Expected Output:</span>{' '}
                                {testCase.expectedOutput}
                              </div>
                              {testCase.explanation && (
                                <div className="text-sm text-gray-500">{testCase.explanation}</div>
                              )}
                            </div>
                          ))}
                        {question.testCases.some((testCase: any) => testCase.isHidden) && (
                          <div className="text-sm text-gray-500">
                            Some test cases are hidden and will only be revealed during grading.
                          </div>
                        )}
                      </div>
                  </div>
                )}

                  {question.explanation && (
                    <div className="mt-4 text-sm text-gray-500">
                      <span className="font-semibold">Explanation:</span> {question.explanation}
                    </div>
                  )}
                </Card>
              ))}
            </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Exam' : 'Create Exam'}
          </Button>
        </div>
      </form>
  )
}
