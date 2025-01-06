'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PencilIcon, ClockIcon, BookOpenIcon, Plus } from 'lucide-react'
import { QuestionCard } from '@/components/teacher-dashboard/questions/QuestionCard'

interface Question {
  id: string
  type: string
  difficulty: string
  points: number
  content: string
  orderIndex: number
}

interface ExamDetailProps {
  exam: {
    id: string
    title: string
    description: string | null
    status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED'
    startTime?: string | null
    endTime?: string | null
    class: {
      id: string
      name: string
    }
    questions: Question[]
    _count: {
      questions: number
      enrollments: number
      submissions: number
    }
  }
}

const statusConfig = {
  DRAFT: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
  SCHEDULED: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
  ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
  COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
} as const

export function ExamDetail({ exam }: ExamDetailProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
          <p className="text-muted-foreground">
            Class: {exam.class.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            variant="secondary"
            className={statusConfig[exam.status].color}
          >
            {statusConfig[exam.status].label}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Exam
          </Button>
        </div>
      </div>

      <Card className="backdrop-blur-sm bg-white/30">
        <CardHeader>
          <CardTitle>Exam Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {exam.startTime ? new Date(exam.startTime).toLocaleString() : 'Not scheduled'}
                {exam.endTime ? ` - ${new Date(exam.endTime).toLocaleString()}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {exam._count.questions} Questions • {exam.questions.reduce((sum, q) => sum + q.points, 0)} Points Total
              </span>
            </div>
          </div>
          {exam.description && (
            <p className="text-sm text-muted-foreground">
              {exam.description}
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="bg-white/30 backdrop-blur-sm">
          <TabsTrigger value="questions">Questions ({exam._count.questions})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({exam._count.submissions})</TabsTrigger>
          <TabsTrigger value="students">Students ({exam._count.enrollments})</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Manage Questions
            </Button>
          </div>

          {exam.questions.length > 0 ? (
            <div className="space-y-4">
              {exam.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onEdit={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">No questions added yet</p>
                  <Button
                    variant="link"
                    onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                  >
                    Add your first question
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No submissions yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No students enrolled yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
