'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { QuestionType, DifficultyLevel } from '@prisma/client'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const baseQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  content: z.string().min(1, 'Question content is required'),
  points: z.number().min(1, 'Points must be at least 1'),
  difficulty: z.nativeEnum(DifficultyLevel),
  explanation: z.string().optional(),
  timeLimit: z.number().min(0).optional(),
})

const multipleChoiceSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
  })).min(2),
})

const shortAnswerSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.SHORT_ANSWER),
  correctAnswer: z.string().min(1),
})

const longAnswerSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.LONG_ANSWER),
  rubric: z.string().optional(),
})

const trueFalseSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.TRUE_FALSE),
  correctAnswer: z.enum(['true', 'false']),
})

const matchingSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.MATCHING),
  matchingPairs: z.array(z.object({
    left: z.string().min(1),
    right: z.string().min(1),
  })).min(2),
})

const codingSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.CODING),
  codeTemplate: z.string().optional(),
  programmingLanguage: z.string().min(1),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string().min(1),
    isHidden: z.boolean(),
    explanation: z.string().optional(),
  })).min(1),
})

const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  shortAnswerSchema,
  longAnswerSchema,
  trueFalseSchema,
  matchingSchema,
  codingSchema,
])

type QuestionFormValues = z.infer<typeof questionSchema>

export default function QuestionsPage({
  params,
}: {
  params: { classId: string; examId: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<QuestionType>(
    QuestionType.MULTIPLE_CHOICE
  )

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: QuestionType.MULTIPLE_CHOICE,
      content: '',
      points: 1,
      difficulty: DifficultyLevel.MEDIUM,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
  })

  // Fetch existing questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['exam-questions', params.examId],
    queryFn: async () => {
      const response = await fetch(
        `/api/teacher/exams/${params.examId}/questions`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      return response.json()
    },
  })

  // Add question mutation
  const addQuestion = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const response = await fetch(
        `/api/teacher/exams/${params.examId}/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to add question')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exam-questions', params.examId],
      })
      toast({
        title: 'Question added successfully',
      })
      form.reset()
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add question. Please try again.',
        variant: 'destructive',
      })
    },
  })

  // Delete question mutation
  const deleteQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch(
        `/api/teacher/exams/${params.examId}/questions`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questionId }),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to delete question')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['exam-questions', params.examId],
      })
      toast({
        title: 'Question deleted successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete question. Please try again.',
        variant: 'destructive',
      })
    },
  })

  function onSubmit(data: QuestionFormValues) {
    addQuestion.mutate(data)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4">
        <Link href={`/teacher/classes/${params.classId}`}>
          <Button variant="outline" size="sm" className="w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Class
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Add Questions</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Question Form */}
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedType(value as QuestionType)
                        // Reset form with new defaults based on type
                        form.reset({
                          type: value as QuestionType,
                          content: '',
                          points: 1,
                          difficulty: DifficultyLevel.MEDIUM,
                          ...(value === QuestionType.MULTIPLE_CHOICE && {
                            options: [
                              { text: '', isCorrect: false },
                              { text: '', isCorrect: false },
                            ],
                          }),
                          ...(value === QuestionType.CODING && {
                            testCases: [
                              {
                                input: '',
                                expectedOutput: '',
                                isHidden: false,
                              },
                            ],
                          }),
                          ...(value === QuestionType.MATCHING && {
                            matchingPairs: [
                              { left: '', right: '' },
                              { left: '', right: '' },
                            ],
                          }),
                        })
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={QuestionType.MULTIPLE_CHOICE}>
                          Multiple Choice
                        </SelectItem>
                        <SelectItem value={QuestionType.SHORT_ANSWER}>
                          Short Answer
                        </SelectItem>
                        <SelectItem value={QuestionType.LONG_ANSWER}>
                          Long Answer
                        </SelectItem>
                        <SelectItem value={QuestionType.TRUE_FALSE}>
                          True/False
                        </SelectItem>
                        <SelectItem value={QuestionType.MATCHING}>
                          Matching
                        </SelectItem>
                        <SelectItem value={QuestionType.CODING}>
                          Coding
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your question"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DifficultyLevel.EASY}>
                            Easy
                          </SelectItem>
                          <SelectItem value={DifficultyLevel.MEDIUM}>
                            Medium
                          </SelectItem>
                          <SelectItem value={DifficultyLevel.HARD}>
                            Hard
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Conditional fields based on question type */}
              {selectedType === QuestionType.MULTIPLE_CHOICE && (
                <div className="space-y-4">
                  <FormLabel>Options</FormLabel>
                  {form.watch('options')?.map((_, index) => (
                    <div key={index} className="flex gap-4">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        {...form.register(`options.${index}.text`)}
                      />
                      <Select
                        value={
                          form.watch(`options.${index}.isCorrect`)
                            ? 'true'
                            : 'false'
                        }
                        onValueChange={(value) =>
                          form.setValue(
                            `options.${index}.isCorrect`,
                            value === 'true'
                          )
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Correct</SelectItem>
                          <SelectItem value="false">Incorrect</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      form.setValue('options', [
                        ...(form.watch('options') || []),
                        { text: '', isCorrect: false },
                      ])
                    }
                  >
                    Add Option
                  </Button>
                </div>
              )}

              {selectedType === QuestionType.SHORT_ANSWER && (
                <FormField
                  control={form.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter the correct answer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === QuestionType.TRUE_FALSE && (
                <FormField
                  control={form.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={addQuestion.isPending}
              >
                {addQuestion.isPending ? 'Adding...' : 'Add Question'}
              </Button>
            </form>
          </Form>
        </Card>

        {/* Questions List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Added Questions</h2>
            <Button
              onClick={() => router.push(`/teacher/classes/${params.classId}`)}
              disabled={questions.length === 0}
            >
              Finish
            </Button>
          </div>

          {isLoading ? (
            <div>Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No questions added yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question: any) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">
                      {question.content}
                    </TableCell>
                    <TableCell>{question.type}</TableCell>
                    <TableCell>{question.points}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to delete this question?'
                            )
                          ) {
                            deleteQuestion.mutate(question.id)
                          }
                        }}
                        disabled={deleteQuestion.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
} 