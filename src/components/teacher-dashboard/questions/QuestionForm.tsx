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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Editor } from '@/components/editor'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash } from 'lucide-react'

const questionSchema = z.object({
  type: z.enum([
    'MULTIPLE_CHOICE',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'TRUE_FALSE',
    'MATCHING',
    'CODING',
  ]),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  points: z.coerce.number().min(1),
  content: z.string().min(1, 'Question content is required'),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  timeLimit: z.coerce.number().min(0).optional(),
  options: z.array(z.string()).optional(),
  codeTemplate: z.string().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean(),
      })
    )
    .optional(),
})

type QuestionFormData = z.infer<typeof questionSchema>

interface QuestionFormProps {
  question?: QuestionFormData
  onSubmit: (data: QuestionFormData) => void
  onCancel: () => void
}

export function QuestionForm({ question, onSubmit, onCancel }: QuestionFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: question?.type ?? 'MULTIPLE_CHOICE',
      difficulty: question?.difficulty ?? 'MEDIUM',
      points: question?.points ?? 1,
      content: question?.content ?? '',
      correctAnswer: question?.correctAnswer ?? '',
      explanation: question?.explanation ?? '',
      timeLimit: question?.timeLimit ?? 0,
      options: question?.options ?? [''],
      codeTemplate: question?.codeTemplate ?? '',
      testCases: question?.testCases ?? [
        { input: '', expectedOutput: '', isHidden: false },
      ],
    },
  })

  const questionType = form.watch('type')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MULTIPLE_CHOICE">
                          Multiple Choice
                        </SelectItem>
                        <SelectItem value="SHORT_ANSWER">
                          Short Answer
                        </SelectItem>
                        <SelectItem value="LONG_ANSWER">
                          Long Answer
                        </SelectItem>
                        <SelectItem value="TRUE_FALSE">
                          True/False
                        </SelectItem>
                        <SelectItem value="MATCHING">Matching</SelectItem>
                        <SelectItem value="CODING">Coding</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="No limit"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for no time limit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your question here..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {questionType === 'MULTIPLE_CHOICE' && (
              <FormField
                control={form.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Options</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value?.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(field.value || [])]
                                newOptions[index] = e.target.value
                                field.onChange(newOptions)
                              }}
                              placeholder={`Option ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newOptions = field.value?.filter(
                                  (_, i) => i !== index
                                )
                                field.onChange(newOptions)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([...(field.value || []), ''])
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {questionType === 'CODING' && (
              <>
                <FormField
                  control={form.control}
                  name="codeTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code Template</FormLabel>
                      <FormControl>
                        <Editor
                          value={field.value || ''}
                          onChange={field.onChange}
                          language="python"
                          height="200px"
                        />
                      </FormControl>
                      <FormDescription>
                        Initial code template for students
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testCases"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Cases</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {field.value?.map((testCase, index) => (
                            <Card key={index}>
                              <CardContent className="space-y-4 p-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">
                                    Test Case {index + 1}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newTestCases = [
                                          ...(field.value || []),
                                        ]
                                        newTestCases[index] = {
                                          ...testCase,
                                          isHidden: !testCase.isHidden,
                                        }
                                        field.onChange(newTestCases)
                                      }}
                                    >
                                      {testCase.isHidden ? (
                                        <Badge variant="secondary">Hidden</Badge>
                                      ) : (
                                        <Badge>Visible</Badge>
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const newTestCases = field.value?.filter(
                                          (_, i) => i !== index
                                        )
                                        field.onChange(newTestCases)
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <FormLabel>Input</FormLabel>
                                    <Textarea
                                      value={testCase.input}
                                      onChange={(e) => {
                                        const newTestCases = [
                                          ...(field.value || []),
                                        ]
                                        newTestCases[index] = {
                                          ...testCase,
                                          input: e.target.value,
                                        }
                                        field.onChange(newTestCases)
                                      }}
                                      placeholder="Test case input"
                                    />
                                  </div>
                                  <div>
                                    <FormLabel>Expected Output</FormLabel>
                                    <Textarea
                                      value={testCase.expectedOutput}
                                      onChange={(e) => {
                                        const newTestCases = [
                                          ...(field.value || []),
                                        ]
                                        newTestCases[index] = {
                                          ...testCase,
                                          expectedOutput: e.target.value,
                                        }
                                        field.onChange(newTestCases)
                                      }}
                                      placeholder="Expected output"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              field.onChange([
                                ...(field.value || []),
                                {
                                  input: '',
                                  expectedOutput: '',
                                  isHidden: false,
                                },
                              ])
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Test Case
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the correct answer..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain the correct answer..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be shown to students after they submit their answer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {question ? 'Update Question' : 'Create Question'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
