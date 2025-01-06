'use client'

import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

const classFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Class name must be at least 3 characters')
    .max(50, 'Class name must not exceed 50 characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .nullable(),
})

type ClassFormValues = z.infer<typeof classFormSchema>

export default function NewClassPage() {
  const router = useRouter()
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  async function onSubmit(data: ClassFormValues) {
    try {
      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create class')
      }

      const result = await response.json()
      toast.success('Class created successfully')
      router.push(`/teacher/classes/${result.data.id}`)
    } catch (error) {
      toast.error('Failed to create class')
      console.error('Error creating class:', error)
    }
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Class</h1>
            <p className="text-muted-foreground">
              Set up a new class for your students
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <Card className="md:col-span-8">
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
              <CardDescription>
                Enter the basic information for your new class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter class name"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is how your class will be displayed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter class description"
                            className="resize-none"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide additional details about your class
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Class</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Class Name</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a clear and descriptive name that helps students identify
                  the class content.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Description</h3>
                <p className="text-sm text-muted-foreground">
                  Add details about the class objectives, schedule, or any other
                  relevant information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherDashboardLayout>
  )
}