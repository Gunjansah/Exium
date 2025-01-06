'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QuestionCard } from '@/components/teacher-dashboard/questions/QuestionCard'
import { QuestionForm } from '@/components/teacher-dashboard/questions/QuestionForm'
import { LoadingPageSkeleton } from '@/components/loading'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { toast } from 'sonner'
import { Plus, GripVertical } from 'lucide-react'

interface Question {
  id: string
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'TRUE_FALSE' | 'MATCHING' | 'CODING'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  points: number
  content: string
  correctAnswer?: string
  options?: any
  explanation?: string
  orderIndex: number
  timeLimit?: number
  codeTemplate?: string
  testCases?: any
}

export default function QuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>(undefined)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ['exam', params.examId],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${params.examId}`)
      if (!response.ok) throw new Error('Failed to fetch exam')
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['questions', params.examId],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${params.examId}/questions`)
      if (!response.ok) throw new Error('Failed to fetch questions')
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const createQuestionMutation = useMutation({
    mutationFn: async (data: Omit<Question, 'id'>) => {
      const response = await fetch(`/api/exams/${params.examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create question')
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', params.examId] })
      setIsAddingQuestion(false)
      toast.success('Question created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: Question) => {
      const response = await fetch(`/api/exams/${params.examId}/questions/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update question')
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', params.examId] })
      setSelectedQuestion(undefined)
      toast.success('Question updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch(`/api/exams/${params.examId}/questions/${questionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete question')
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', params.examId] })
      toast.success('Question deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const reorderQuestionsMutation = useMutation({
    mutationFn: async (questions: Question[]) => {
      const response = await fetch(`/api/exams/${params.examId}/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })
      if (!response.ok) throw new Error('Failed to reorder questions')
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', params.examId] })
      toast.success('Questions reordered successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  if (isLoadingExam || isLoadingQuestions) {
    return <LoadingPageSkeleton />
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
            <p className="text-muted-foreground">
              Manage questions for this exam
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/teacher/exams/${params.examId}/edit`)}
              variant="outline"
            >
              Edit Exam
            </Button>
            <Button
              onClick={() => setIsAddingQuestion(true)}
              disabled={isAddingQuestion}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  {questions.length} question{questions.length !== 1 ? 's' : ''} in total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (over && active.id !== over.id) {
                        const oldIndex = questions.findIndex((q: Question) => q.id === active.id)
                        const newIndex = questions.findIndex((q: Question) => q.id === over.id)
                        const newQuestions = [...questions]
                        const [removed] = newQuestions.splice(oldIndex, 1)
                        newQuestions.splice(newIndex, 0, removed)
                        const updatedQuestions = newQuestions.map((q, i) => ({
                          ...q,
                          orderIndex: i,
                        }))
                        reorderQuestionsMutation.mutate(updatedQuestions)
                      }
                    }}
                  >
                    <SortableContext
                      items={questions}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {questions.map((question: Question) => (
                          <QuestionCard
                            key={question.id}
                            question={question}
                            isSelected={selectedQuestion?.id === question.id}
                            onSelect={() => setSelectedQuestion(question)}
                            onDelete={() => deleteQuestionMutation.mutate(question.id)}
                            onEdit={() => setSelectedQuestion(question)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {isAddingQuestion
                    ? 'Add New Question'
                    : selectedQuestion
                    ? 'Edit Question'
                    : 'Question Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(isAddingQuestion || selectedQuestion) && (
                  <QuestionForm
                    question={selectedQuestion}
                    onSubmit={(data) => {
                      if (selectedQuestion) {
                        updateQuestionMutation.mutate({ ...selectedQuestion, ...data })
                      } else {
                        createQuestionMutation.mutate({
                          ...data,
                          orderIndex: questions.length,
                        })
                      }
                    }}
                    onCancel={() => {
                      setIsAddingQuestion(false)
                      setSelectedQuestion(undefined)
                    }}
                  />
                )}
                {!isAddingQuestion && !selectedQuestion && (
                  <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                    Select a question to edit or create a new one
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TeacherDashboardLayout>
  )
}
