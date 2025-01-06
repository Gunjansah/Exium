'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { LoadingPageSkeleton } from '@/components/loading'

const inviteFormSchema = z.object({
  emails: z
    .string()
    .min(1, 'Please enter at least one email address')
    .refine(
      (value) => {
        const emails = value
          .split(/[\n,]/)
          .map((email) => email.trim())
          .filter(Boolean)
        return emails.every((email) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        )
      },
      {
        message: 'Please enter valid email addresses, separated by commas or new lines',
      }
    ),
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

interface ClassResponse {
  success: boolean
  data: {
    id: string
    name: string
  } | null
  error?: string
}

export default function InviteStudentsPage() {
  const router = useRouter()
  const params = useParams<{ classId: string }>()

  const { data: response, isLoading } = useQuery<ClassResponse>({
    queryKey: ['class', params.classId],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/classes/${params.classId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch class')
      }
      return res.json()
    },
  })

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emails: '',
    },
  })

  if (isLoading) {
    return <LoadingPageSkeleton />
  }

  if (!response?.success || !response.data) {
    return (
      <TeacherDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-2">Class Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The class you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/teacher/classes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
        </div>
      </TeacherDashboardLayout>
    )
  }

  const classData = response.data

  async function onSubmit(data: InviteFormValues) {
    try {
      const emails = data.emails
        .split(/[\n,]/)
        .map((email) => email.trim())
        .filter(Boolean)

      const response = await fetch(`/api/teacher/classes/${params.classId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invitations')
      }

      toast.success('Invitations sent successfully')
      router.push(`/teacher/classes/${params.classId}`)
    } catch (error) {
      toast.error('Failed to send invitations')
      console.error('Error sending invitations:', error)
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
            <h1 className="text-3xl font-bold tracking-tight">
              Invite Students to {classData.name}
            </h1>
            <p className="text-muted-foreground">
              Send invitations to students to join your class
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <Card className="md:col-span-8">
            <CardHeader>
              <CardTitle>Student Emails</CardTitle>
              <CardDescription>
                Enter the email addresses of students you want to invite
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
                    name="emails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Addresses</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter email addresses, one per line or separated by commas"
                            className="min-h-[200px] font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Example: student1@example.com, student2@example.com
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
                    <Button type="submit">Send Invitations</Button>
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
                <h3 className="font-medium mb-1">Multiple Emails</h3>
                <p className="text-sm text-muted-foreground">
                  You can enter multiple email addresses separated by commas or new
                  lines.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Valid Formats</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure all email addresses are correctly formatted and active.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Invitation Process</h3>
                <p className="text-sm text-muted-foreground">
                  Students will receive an email with instructions to join your
                  class.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherDashboardLayout>
  )
}