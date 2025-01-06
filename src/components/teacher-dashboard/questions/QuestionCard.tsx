'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Pencil } from 'lucide-react'
import cn from 'classnames'

interface Question {
  id: string
  type: string
  difficulty: string
  points: number
  content: string
  orderIndex: number
}

interface QuestionCardProps {
  question: Question
  isSelected?: boolean
  onSelect?: () => void
  onDelete?: () => void
  onEdit: () => void
}

export function QuestionCard({ question, onEdit, isSelected, onSelect, onDelete }: QuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HARD':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'bg-purple-100 text-purple-800'
      case 'SHORT_ANSWER':
        return 'bg-blue-100 text-blue-800'
      case 'LONG_ANSWER':
        return 'bg-indigo-100 text-indigo-800'
      case 'TRUE_FALSE':
        return 'bg-pink-100 text-pink-800'
      case 'MATCHING':
        return 'bg-orange-100 text-orange-800'
      case 'CODING':
        return 'bg-cyan-100 text-cyan-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card 
        className={cn(
          'transition-colors duration-200',
          isSelected && 'ring-2 ring-primary',
          'hover:bg-accent/50'
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div {...listeners} className="cursor-grab">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{question.type}</Badge>
                  <Badge
                    className={cn(
                      getDifficultyColor(question.difficulty),
                      'capitalize'
                    )}
                  >
                    {question.difficulty.toLowerCase()}
                  </Badge>
                  <Badge variant="secondary">{question.points} points</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                      }}
                    >
                      <span className="sr-only">Delete question</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm">{question.content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
