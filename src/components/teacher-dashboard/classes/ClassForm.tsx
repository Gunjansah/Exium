'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

const formSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  code: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ClassFormProps {
  onSubmit: (values: FormValues) => Promise<{ id: string; code: string } | void>
  initialData?: {
    id: string
    name: string
    description: string | null
    code: string
  }
}

export function ClassForm({ onSubmit, initialData }: ClassFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || undefined,
      code: initialData.code,
    } : {
      name: '',
      description: '',
      code: '',
    },
  })

  const handleSubmit = async (values: FormValues) => {
    try {
      const result = await onSubmit(values)
      
      // Invalidate and refetch all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['classes'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      ])

      // Force a router refresh to update server components
      router.refresh()

      toast({
        title: `Class ${initialData ? 'updated' : 'created'} successfully`,
        description: initialData 
          ? "All changes have been saved and synced."
          : result?.code
            ? `Class created successfully. The class code is: ${result.code}. Share this code with your students to let them join the class.`
            : "Class created successfully.",
      })

      if (!initialData) {
        // Redirect to the classes page after creation
        router.push('/teacher/classes')
      }
    } catch (error) {
      console.error('Error submitting class:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save class. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label>Class Name</Label>
          <Input {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <Label>Description</Label>
          <Textarea {...form.register('description')} />
        </div>

        <div>
          <Label>Class Code (Optional)</Label>
          <Input {...form.register('code')} placeholder="Leave empty to generate automatically" />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Class' : 'Create Class'}
        </Button>
      </div>
    </form>
  )
} 