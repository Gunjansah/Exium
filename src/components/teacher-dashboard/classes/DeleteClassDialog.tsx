'use client'

import { useDeleteClass } from '@/hooks/use-classes'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { ClassWithDetails } from '@/types/class'
import { useState } from 'react'

interface DeleteClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classData: ClassWithDetails
}

export function DeleteClassDialog({
  open,
  onOpenChange,
  classData,
}: DeleteClassDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const deleteClass = useDeleteClass()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteClass.mutateAsync(classData.id)
      toast({
        title: 'Class deleted',
        description: 'The class has been deleted successfully.',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Failed to delete class',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Class</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{classData.name}&quot;? This
            action cannot be undone and will remove all associated data including
            exams and student enrollments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Class'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
