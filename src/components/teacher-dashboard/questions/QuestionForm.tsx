'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Question } from '@/store/examCreation'

interface QuestionFormProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
  onRemove: () => void
}

export function QuestionForm({ question, onUpdate, onRemove }: QuestionFormProps) {
  const [localQuestion, setLocalQuestion] = useState(question)

  const handleChange = (field: keyof Question, value: any) => {
    const updates = { [field]: value }
    setLocalQuestion(prev => ({ ...prev, ...updates }))
    onUpdate(updates)
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...(localQuestion.options || [])]
    newOptions[index] = { text }
    handleChange('options', newOptions)
  }

  const addOption = () => {
    const newOptions = [...(localQuestion.options || []), { text: '' }]
    handleChange('options', newOptions)
  }

  const removeOption = (index: number) => {
    const newOptions = (localQuestion.options || []).filter((_, i) => i !== index)
    handleChange('options', newOptions)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={localQuestion.type}
          onValueChange={(value) => handleChange('type', value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Question Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
            <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
            <SelectItem value="LONG_ANSWER">Long Answer</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="destructive" size="sm" onClick={onRemove}>
          Remove Question
        </Button>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Question content"
          value={localQuestion.content}
          onChange={(e) => handleChange('content', e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="w-24">
          <Input
            type="number"
            placeholder="Points"
            value={localQuestion.points}
            onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
            min={1}
          />
        </div>
        <div className="w-24">
          <Input
            type="number"
            placeholder="Time limit (min)"
            value={localQuestion.timeLimit || ''}
            onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || undefined)}
            min={0}
          />
        </div>
      </div>

      {localQuestion.type === 'MULTIPLE_CHOICE' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Options</p>
          {(localQuestion.options || []).map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option.text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
          >
            Add Option
          </Button>
        </div>
      )}
    </div>
  )
}
