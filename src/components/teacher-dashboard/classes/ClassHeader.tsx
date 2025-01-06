'use client'

import { useState } from 'react'
import { ClassWithDetails } from '@/types/class'
import { Button } from '@/components/ui/button'
import { EditClassDialog } from './EditClassDialog'
import { DeleteClassDialog } from './DeleteClassDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Copy,
  MoreVertical,
  Settings,
  Share2,
  Trash,
  Users,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ClassHeaderProps {
  classData: ClassWithDetails
}

export function ClassHeader({ classData }: ClassHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  const copyInviteCode = () => {
    navigator.clipboard.writeText(classData.code)
    toast({
      title: 'Invite code copied',
      description: 'The class invite code has been copied to your clipboard.',
    })
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="text-sm text-gray-500">Class Code:</div>
          <code className="px-2 py-1 text-sm font-mono bg-gray-100 rounded">
            {classData.code}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={copyInviteCode}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Invite Students
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Class
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Class
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditClassDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        classData={classData}
      />
      <DeleteClassDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        classData={classData}
      />
    </div>
  )
}
