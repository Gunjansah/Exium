'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { QuestionType, DifficultyLevel } from '@prisma/client'
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Minus } from 'lucide-react'

interface QuestionFormProps {
  onSubmit: (data: QuestionFormValues) => void
  onCancel: () => void
}

const questionTypes = [
  'MULTIPLE_CHOICE',
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'TRUE_FALSE',
  'MATCHING',
  'CODING',
] as const

const questionSchema = z.object({
  type: z.enum(questionTypes),
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
})

type QuestionFormValues = z.infer<typeof questionSchema>

export function QuestionForm({ onSubmit, onCancel }: QuestionFormProps) {
  const [selectedType, setSelectedType] = useState<QuestionFormValues['type']>('MULTIPLE_CHOICE')

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: 'MULTIPLE_CHOICE',
      content: '',
      points: 1,
      difficulty: 'MEDIUM',
      explanation: '',
      timeLimit: 0,
      options: [
        { text: '', isCorrect: false, explanation: '' },
        { text: '', isCorrect: false, explanation: '' },
      ],
    },
  })

  const handleSubmit = (data: QuestionFormValues) => {
    // Add any necessary transformations based on question type
    switch (data.type) {
      case 'MULTIPLE_CHOICE':
        if (!data.options || data.options.length < 2) {
          form.setError('options', {
            type: 'manual',
            message: 'At least 2 options are required',
          })
          return
        }
        // Check if at least one option is marked as correct
        if (!data.options.some(option => option.isCorrect)) {
          form.setError('options', {
            type: 'manual',
            message: 'At least one option must be marked as correct',
          })
          return
        }
        break
      case 'SHORT_ANSWER':
      case 'TRUE_FALSE':
        if (!data.correctAnswer) {
          form.setError('correctAnswer', {
            type: 'manual',
            message: 'Correct answer is required',
          })
          return
        }
        break
      case 'MATCHING':
        if (!data.matchingPairs || data.matchingPairs.length < 2) {
          form.setError('matchingPairs', {
            type: 'manual',
            message: 'At least 2 matching pairs are required',
          })
          return
        }
        break
      case 'CODING':
        if (!data.testCases || data.testCases.length === 0) {
          form.setError('testCases', {
            type: 'manual',
            message: 'At least 1 test case is required',
          })
          return
        }
        if (!data.programmingLanguage) {
          form.setError('programmingLanguage', {
            type: 'manual',
            message: 'Programming language is required',
          })
          return
        }
        if (!data.codeTemplate) {
          form.setError('codeTemplate', {
            type: 'manual',
            message: 'Code template is required',
          })
          return
        }
        break
    }

    onSubmit(data)
    // Reset form with appropriate default values based on type
    form.reset({
      type: data.type,
      content: '',
      points: 1,
      difficulty: 'MEDIUM',
      explanation: '',
      timeLimit: 0,
      options: data.type === 'MULTIPLE_CHOICE' ? [
        { text: '', isCorrect: false, explanation: '' },
        { text: '', isCorrect: false, explanation: '' },
      ] : undefined,
      correctAnswer: undefined,
      rubric: undefined,
      matchingPairs: data.type === 'MATCHING' ? [
        { left: '', right: '' },
        { left: '', right: '' },
      ] : undefined,
      codeTemplate: undefined,
      testCases: data.type === 'CODING' ? [
        { input: '', expectedOutput: '', isHidden: false, explanation: '' }
      ] : undefined,
      programmingLanguage: data.type === 'CODING' ? data.programmingLanguage : undefined,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Type</FormLabel>
              <Select
                onValueChange={(value: QuestionFormValues['type']) => {
                  field.onChange(value)
                  setSelectedType(value)
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                  <SelectItem value="LONG_ANSWER">Long Answer</SelectItem>
                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                  <SelectItem value="MATCHING">Matching</SelectItem>
                  <SelectItem value="CODING">Coding</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Common fields */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Content</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter your question here" />
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
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        {/* Type-specific fields */}
        {selectedType === 'MULTIPLE_CHOICE' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel>Options</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const options = form.getValues('options') || []
                  form.setValue('options', [
                    ...options,
                    { text: '', isCorrect: false, explanation: '' },
                  ])
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Option
              </Button>
            </div>
            {form.watch('options')?.map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`options.${index}.text`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder={`Option ${index + 1}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`options.${index}.isCorrect`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center space-x-2 h-10">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span className="text-sm">Correct</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch('options')?.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const options = form.getValues('options') || []
                        form.setValue(
                          'options',
                          options.filter((_, i) => i !== index)
                        )
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name={`options.${index}.explanation`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={`Explanation for option ${index + 1} (optional)`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {(selectedType === 'SHORT_ANSWER' || selectedType === 'TRUE_FALSE') && (
          <FormField
            control={form.control}
            name="correctAnswer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Answer</FormLabel>
                <FormControl>
                  {selectedType === 'TRUE_FALSE' ? (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
                  ) : (
                    <Input {...field} placeholder="Enter the correct answer" />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === 'LONG_ANSWER' && (
          <FormField
            control={form.control}
            name="rubric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grading Rubric</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter the grading rubric for this question"
                  />
                </FormControl>
                <FormDescription>
                  Provide guidelines for grading this long answer question
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === 'MATCHING' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel>Matching Pairs</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const pairs = form.getValues('matchingPairs') || []
                  form.setValue('matchingPairs', [
                    ...pairs,
                    { left: '', right: '' },
                  ])
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Pair
              </Button>
            </div>
            {form.watch('matchingPairs')?.map((_, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`matchingPairs.${index}.left`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Left side" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`matchingPairs.${index}.right`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder="Right side" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch('matchingPairs')?.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const pairs = form.getValues('matchingPairs') || []
                        form.setValue(
                          'matchingPairs',
                          pairs.filter((_, i) => i !== index)
                        )
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedType === 'CODING' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="programmingLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programming Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codeTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code Template</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the initial code template"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Provide the initial code template for students
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Test Cases</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const testCases = form.getValues('testCases') || []
                    form.setValue('testCases', [
                      ...testCases,
                      { input: '', expectedOutput: '', isHidden: false, explanation: '' },
                    ])
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Test Case
                </Button>
              </div>
              {form.watch('testCases')?.map((_, index) => (
                <div key={index} className="space-y-2 border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`testCases.${index}.input`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Input</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Test case input" className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`testCases.${index}.expectedOutput`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Output</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Expected output" className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name={`testCases.${index}.isHidden`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <span className="text-sm">Hidden test case</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {form.watch('testCases')?.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const testCases = form.getValues('testCases') || []
                          form.setValue(
                            'testCases',
                            testCases.filter((_, i) => i !== index)
                          )
                        }}
                      >
                        <Minus className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name={`testCases.${index}.explanation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Explanation</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Explanation for this test case (optional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Provide an explanation for the correct answer"
                />
              </FormControl>
              <FormDescription>
                This will be shown to students after they submit their answer
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
              <FormLabel>Time Limit (seconds)</FormLabel>
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Add Question</Button>
        </div>
      </form>
    </Form>
  )
}
