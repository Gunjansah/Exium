import { ExamWithDetails } from '@/types/exam'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Pencil, Users, FileText, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ExamListProps {
  exams: ExamWithDetails[]
  onDeleteExam: (examId: string) => void
  classId: string
}

const statusColors = {
  DRAFT: 'secondary',
  PUBLISHED: 'default',
  ACTIVE: 'outline',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
  ARCHIVED: 'secondary'
} as const

export function ExamList({ exams, onDeleteExam, classId }: ExamListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <Card key={exam.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {exam.description || 'No description provided'}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/classes/${classId}/exams/${exam.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Exam
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/classes/${classId}/exams/${exam.id}/questions`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Manage Questions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/classes/${classId}/exams/${exam.id}/students`}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Students
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteExam(exam.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Exam
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={statusColors[exam.status]}>{exam.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{exam.duration} minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Questions</p>
                  <p className="font-medium">{exam._count.questions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-medium">{exam._count.enrollments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submissions</p>
                  <p className="font-medium">{exam._count.submissions}</p>
                </div>
              </div>

              {exam.startTime && (
                <div className="pt-2 text-sm">
                  <p className="text-muted-foreground">Scheduled for</p>
                  <p className="font-medium">
                    {new Date(exam.startTime).toLocaleDateString()} at{' '}
                    {new Date(exam.startTime).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
