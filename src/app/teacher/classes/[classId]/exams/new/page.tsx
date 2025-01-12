'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useCreateExam } from '@/hooks/use-exams'
import { Question } from '@/types/exam'
import { ExamForm } from '@/components/teacher-dashboard/exams/ExamForm'
import { QuestionForm } from '@/components/teacher-dashboard/questions/QuestionForm'
import { QuestionPreview } from '@/components/teacher-dashboard/questions/QuestionPreview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Eye, Save } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'

export default function NewExamPage() {
  const router = useRouter()
  const params = useParams()
  const classId = params.classId as string
  const { toast } = useToast()
  const createExam = useCreateExam(classId)

  const [questions, setQuestions] = useState<Question[]>([])
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  const handleQuestionSubmit = (question: Question) => {
    if (selectedQuestionIndex !== null) {
      // Edit existing question
      const updatedQuestions = [...questions]
      updatedQuestions[selectedQuestionIndex] = {
        ...question,
        orderIndex: selectedQuestionIndex,
      }
      setQuestions(updatedQuestions)
      setSelectedQuestionIndex(null)
    } else {
      // Add new question
      setQuestions([
        ...questions,
        {
          ...question,
          orderIndex: questions.length,
        },
      ])
    }
    setIsAddingQuestion(false)
  }

  const handleExamSubmit = async (data: any) => {
    try {
      await createExam.mutateAsync({
        ...data,
        classId,
        questions: questions.map((q, index) => ({
          ...q,
          orderIndex: index,
        })),
      })

      toast({
        title: 'Success',
        description: 'Exam created successfully',
      })

      router.push(`/teacher/classes/${classId}/exams`)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create exam',
        variant: 'destructive',
      })
    }
  }

  const handleEditQuestion = (index: number) => {
    setSelectedQuestionIndex(index)
    setIsAddingQuestion(true)
  }

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
    setQuestions(updatedQuestions)
  }

  const handleMoveQuestion = (fromIndex: number, toIndex: number) => {
    const updatedQuestions = [...questions]
    const [movedQuestion] = updatedQuestions.splice(fromIndex, 1)
    updatedQuestions.splice(toIndex, 0, movedQuestion)
    setQuestions(updatedQuestions)
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Exam</h1>
            <p className="text-muted-foreground">
              Create a new exam for your class
            </p>
          </div>
          <Button onClick={() => router.back()}>Cancel</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="questions">
              Questions ({questions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
              </CardHeader>
              <CardContent>
                <ExamForm onSubmit={handleExamSubmit} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">
                      Questions
                    </CardTitle>
                    <Button onClick={() => setIsAddingQuestion(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      {questions.map((question, index) => (
                        <Card key={index} className="mb-4">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {index + 1}. {question.content}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <span>{question.type}</span>
                                  <span>•</span>
                                  <span>{question.points} points</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditQuestion(index)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(index)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div>
                {isAddingQuestion ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {selectedQuestionIndex !== null
                          ? 'Edit Question'
                          : 'Add Question'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <QuestionForm
                        onSubmit={handleQuestionSubmit}
                        defaultValues={
                          selectedQuestionIndex !== null
                            ? questions[selectedQuestionIndex]
                            : undefined
                        }
                        onCancel={() => {
                          setIsAddingQuestion(false)
                          setSelectedQuestionIndex(null)
                        }}
                      />
                    </CardContent>
                  </Card>
                ) : questions.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Question Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px] pr-4">
                        {questions.map((question, index) => (
                          <div key={index} className="mb-8">
                            <QuestionPreview
                              question={question}
                              showAnswers={true}
                              onEdit={() => handleEditQuestion(index)}
                            />
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <div className="rounded-full bg-muted p-4">
                          <Eye className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium">No Questions Yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Add questions to preview them here
                          </p>
                        </div>
                        <Button onClick={() => setIsAddingQuestion(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Question
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherDashboardLayout>
  )
}
