'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useExamCreationStore } from '@/store/examCreation'
import { ExamForm } from '@/components/teacher-dashboard/exams/ExamForm'
import { examFormSchema } from '@/lib/validations/exam'
import type { ExamFormValues } from '@/types/exam'

export default function CreateExamPage({ params }: { params: { classId: string } }) {
  const router = useRouter()
  const { metadata, questions, securitySettings, isSubmitting, setMetadata } = useExamCreationStore()

  // Initialize form with React Hook Form
  const methods = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: metadata.title,
      description: metadata.description,
      duration: metadata.duration,
      classId: params.classId,
      questions: questions,
      ...securitySettings,
    },
  })

  // Update store when form changes
  useEffect(() => {
    const subscription = methods.watch((value) => {
      if (value) {
        setMetadata({
          title: value.title || '',
          description: value.description,
          duration: value.duration || 60,
          classId: params.classId,
        })
      }
    })
    return () => subscription.unsubscribe()
  }, [methods.watch, setMetadata, params.classId])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4">
        <Link href={`/teacher/classes/${params.classId}`}>
          <Button variant="outline" size="sm" className="w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Class
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create New Exam</h1>
      </div>

      <FormProvider {...methods}>
        <Card className="p-6">
          <ExamForm
            defaultValues={{
              title: metadata.title,
              description: metadata.description,
              duration: metadata.duration,
              classId: params.classId,
              questions: questions,
              ...securitySettings,
            }}
            isLoading={isSubmitting}
            classId={params.classId}
          />
        </Card>
      </FormProvider>
    </div>
  )
} 