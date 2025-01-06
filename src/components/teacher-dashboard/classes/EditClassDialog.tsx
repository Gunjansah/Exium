'use client'

import { useState } from 'react'
import { useUpdateClass } from '@/hooks/use-classes'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { ClassWithDetails } from '@/types/class'

interface EditClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classData: ClassWithDetails
}

export function EditClassDialog({
  open,
  onOpenChange,
  classData,
}: EditClassDialogProps) {
  const [name, setName] = useState(classData.name)
  const [description, setDescription] = useState(classData.description || '')
  const { toast } = useToast()
  const updateClass = useUpdateClass(classData.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateClass.mutateAsync({
        name: name.trim(),
        description: description.trim(),
      })

      toast({
        title: 'Class updated',
        description: 'Your class has been updated successfully.',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Failed to update class',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update your class information. This will be visible to all students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Data Structures and Algorithms"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the class..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateClass.isPending || !name.trim()}
            >
              {updateClass.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Class'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
