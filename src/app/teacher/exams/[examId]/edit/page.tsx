'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useExam, useUpdateExam } from '@/hooks/use-exams'
import { useToast } from '@/hooks/use-toast'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { ExamForm } from '@/components/teacher-dashboard/exams/ExamForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditExamPage({
  params,
}: {
  params: { examId: string }
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: exam, isLoading } = useExam(params.examId)
  const updateExam = useUpdateExam(params.examId)
  const { toast } = useToast()

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      await updateExam.mutateAsync(data)
      toast({
        title: 'Success',
        description: 'Exam updated successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update exam',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <TeacherDashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-8 w-8" />
            <div>
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[300px] mt-1" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[100px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TeacherDashboardLayout>
    )
  }

  if (!exam) {
    return (
      <TeacherDashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Exam not found</h1>
            <p className="text-gray-500">
              The exam you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to edit it.
            </p>
          </div>
        </div>
      </TeacherDashboardLayout>
    )
  }

  return (
    <TeacherDashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Exam</h1>
            <p className="text-sm text-gray-500">
              Update exam details and manage questions
            </p>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExamForm
                      defaultValues={{
                        title: exam.title,
                        description: exam.description ?? undefined,
                        duration: exam.duration,
                        startTime: exam.startTime ? new Date(exam.startTime) : null,
                        endTime: exam.endTime ? new Date(exam.endTime) : null,
                      }}
                      onSubmit={handleSubmit}
                      isLoading={isSubmitting}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium">Current Status</div>
                        <div className="mt-1">
                          <Button variant="outline" className="w-full">
                            {exam.status}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Questions</div>
                        <div className="mt-1 text-2xl font-bold">
                          {exam._count.questions}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Enrolled Students</div>
                        <div className="mt-1 text-2xl font-bold">
                          {exam._count.enrollments}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  Question management coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  Additional settings coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherDashboardLayout>
  )
}
