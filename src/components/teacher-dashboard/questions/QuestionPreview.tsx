'use client'

import { useState } from 'react'
import { Question } from '@/types/exam'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Editor } from '@/components/editor'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionPreviewProps {
  question: Question
  onEdit?: () => void
  showAnswers?: boolean
}

export function QuestionPreview({ question, onEdit, showAnswers = false }: QuestionPreviewProps) {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup className="space-y-2">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1">
                  {option.text}
                  {showAnswers && option.isCorrect && (
                    <Badge className="ml-2" variant="secondary">
                      Correct
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'SHORT_ANSWER':
        return (
          <div className="space-y-2">
            <Input placeholder="Enter your answer" disabled />
            {showAnswers && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Correct Answer:</h4>
                <p className="text-sm">{question.correctAnswer}</p>
              </div>
            )}
          </div>
        )

      case 'LONG_ANSWER':
        return (
          <div className="space-y-2">
            <Textarea placeholder="Enter your answer" className="min-h-[200px]" disabled />
            {showAnswers && question.correctAnswer && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Sample Answer:</h4>
                <p className="text-sm whitespace-pre-wrap">{question.correctAnswer}</p>
              </div>
            )}
            {showAnswers && question.rubric && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Grading Rubric:</h4>
                <p className="text-sm whitespace-pre-wrap">{question.rubric}</p>
              </div>
            )}
          </div>
        )

      case 'TRUE_FALSE':
        return (
          <RadioGroup className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false">False</Label>
            </div>
            {showAnswers && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Correct Answer:</h4>
                <p className="text-sm capitalize">{question.correctAnswer}</p>
              </div>
            )}
          </RadioGroup>
        )

      case 'MATCHING':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Items</h4>
                {question.matchingPairs.map((pair, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span>{pair.left}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Matches</h4>
                {question.matchingPairs.map((pair, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      type="text"
                      placeholder="Enter matching letter"
                      className="w-16"
                      disabled
                    />
                    <span>{showAnswers ? pair.right : '???'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'CODING':
        return (
          <div className="space-y-4">
            {question.codeTemplate && (
              <div>
                <h4 className="text-sm font-medium mb-2">Code Template:</h4>
                <Editor
                  value={question.codeTemplate}
                  language={question.programmingLanguage}
                  editable={false}
                  height="200px"
                />
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium mb-2">Test Cases:</h4>
              <div className="space-y-2">
                {question.testCases
                  .filter((testCase) => !testCase.isHidden || showAnswers)
                  .map((testCase, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-1">Input:</h5>
                            <pre className="text-sm bg-muted p-2 rounded">
                              {testCase.input || '(no input)'}
                            </pre>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-1">
                              Expected Output:
                              {testCase.isHidden && !showAnswers && (
                                <Badge className="ml-2">Hidden</Badge>
                              )}
                            </h5>
                            <pre className="text-sm bg-muted p-2 rounded">
                              {showAnswers || !testCase.isHidden
                                ? testCase.expectedOutput
                                : '(hidden)'}
                            </pre>
                          </div>
                        </div>
                        {testCase.explanation && showAnswers && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium mb-1">Explanation:</h5>
                            <p className="text-sm">{testCase.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Question Preview</CardTitle>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/preview/question/' + question.id, '_blank')}
          >
            <Eye className="mr-2 h-4 w-4" />
            Full Preview
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">{question.content}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Badge variant="outline">{question.type.replace(/_/g, ' ')}</Badge>
                <Badge variant="outline">{question.difficulty}</Badge>
                <Badge variant="outline">{question.points} points</Badge>
                {question.timeLimit && (
                  <Badge variant="outline">{question.timeLimit} seconds</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">{renderQuestionContent()}</div>

        {question.explanation && showAnswers && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Explanation:</h4>
            <p className="text-sm whitespace-pre-wrap">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 text-sm text-muted-foreground">
        <p>This is how the question will appear to students</p>
      </CardFooter>
    </Card>
  )
} 