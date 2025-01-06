'use client'

import { useState } from 'react'
import { useClasses } from '@/hooks/use-classes'
import { ClassWithDetails } from '@/types/class'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { CreateClassDialog } from './CreateClassDialog'
import { formatDistanceToNow } from 'date-fns'
import {
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Users,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditClassDialog } from './EditClassDialog'
import { DeleteClassDialog } from './DeleteClassDialog'

export function ClassList() {
  const [search, setSearch] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { data: classes, isLoading, error } = useClasses()

  // Filter classes based on search
  const filteredClasses = classes?.filter((cls) =>
    cls.name.toLowerCase().includes(search.toLowerCase())
  )

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Failed to load classes. Please try again later.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Your Classes</h2>
          <p className="text-sm text-gray-500">
            Manage your classes and students
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Class
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-[100px] bg-gray-100" />
              <CardContent className="h-[100px] bg-gray-50" />
            </Card>
          ))}
        </div>
      ) : filteredClasses?.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {search
              ? 'Try adjusting your search terms'
              : 'Get started by creating a new class'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClasses?.map((cls) => (
            <ClassCard key={cls.id} class={cls} />
          ))}
        </div>
      )}

      <CreateClassDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}

function ClassCard({ class: cls }: { class: ClassWithDetails }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1">{cls.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">
          {cls.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {cls._count.enrollments} student{cls._count.enrollments !== 1 && 's'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {cls._count.exams} exam{cls._count.exams !== 1 && 's'}
            </span>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Created {formatDistanceToNow(new Date(cls.createdAt), { addSuffix: true })}
        </div>
      </CardContent>
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-1 transition-transform duration-300',
          cls._count.enrollments > 0
            ? 'bg-green-500'
            : 'bg-gray-200'
        )}
      />

      <EditClassDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        classData={cls}
      />
      <DeleteClassDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        classData={cls}
      />
    </Card>
  )
}
