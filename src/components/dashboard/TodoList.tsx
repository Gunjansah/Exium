'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Calendar as CalendarIcon, Trash2, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, addMonths, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

type TodoPriority = 'HIGH' | 'MEDIUM' | 'LOW'
type TodoStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type TodoType = 'EXAM' | 'DEADLINE' | 'ASSIGNMENT' | 'MEETING' | 'REMINDER' | 'OTHER'

interface Todo {
  id: string
  title: string
  description?: string
  start: string
  end?: string | null
  priority: TodoPriority
  status: TodoStatus
  type: TodoType
  extendedProps?: {
    type: TodoType
    classId?: string
    className?: string
    classCode?: string
    duration?: number
  }
}

export default function TodoList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(addMonths(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    type: 'REMINDER' as TodoType
  })

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get events for the next 3 months
      const start = startOfDay(new Date()).toISOString()
      const end = endOfDay(addMonths(new Date(), 3)).toISOString()
      
      const response = await fetch(`/api/student/calendar-events?start=${start}&end=${end}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch deadlines')
      }
      const data = await response.json()
      
      // Add priority based on due date
      const todosWithPriority = data.map((todo: Todo) => ({
        ...todo,
        priority: getPriority(new Date(todo.start))
      }))

      // Sort by date and priority
      const sortedTodos = todosWithPriority.sort((a: Todo, b: Todo) => {
        const dateA = new Date(a.start)
        const dateB = new Date(b.start)
        if (dateA.getTime() === dateB.getTime()) {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return dateA.getTime() - dateB.getTime()
      })

      setTodos(sortedTodos)
    } catch (err) {
      console.error('Error fetching todos:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch deadlines')
    } finally {
      setLoading(false)
    }
  }

  const getPriority = (dueDate: Date): TodoPriority => {
    const now = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 2) return 'HIGH'
    if (diffDays <= 7) return 'MEDIUM'
    return 'LOW'
  }

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/student/calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTodo)
      })

      if (!response.ok) {
        throw new Error('Failed to create reminder')
      }

      setShowAddDialog(false)
      setNewTodo({
        title: '',
        description: '',
        start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: format(addMonths(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        type: 'REMINDER'
      })
      fetchTodos()
    } catch (err) {
      console.error('Error creating todo:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/student/calendar-events?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete reminder')
      }

      fetchTodos()
    } catch (err) {
      console.error('Error deleting todo:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const getTypeStyles = (type: TodoType) => {
    switch (type) {
      case 'EXAM':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'ASSIGNMENT':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'DEADLINE':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      case 'MEETING':
        return 'bg-purple-50 border-purple-200 text-purple-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  const getPriorityStyles = (priority: TodoPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white/50 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">Loading deadlines...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Loader2 className="w-5 h-5" />
          <h3 className="font-medium">Error loading deadlines</h3>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Deadlines & Tasks</h2>
        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {todos.length === 0 ? (
        <div className="text-center py-8 bg-gray-50/50 rounded-lg">
          <p className="text-gray-600">No upcoming deadlines</p>
          <p className="text-sm text-gray-500 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                'p-3 rounded-lg border',
                getTypeStyles(todo.type)
              )}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{todo.title}</h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      getPriorityStyles(todo.priority)
                    )}>
                      {todo.priority}
                    </span>
                  </div>
                  
                  {todo.extendedProps?.className && (
                    <p className="text-sm mt-0.5">
                      {todo.extendedProps.className} ({todo.extendedProps.classCode})
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {format(new Date(todo.start), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(todo.start), 'h:mm a')}
                    </div>
                    <div>
                      {formatDistanceToNow(new Date(todo.start), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {todo.type === 'REMINDER' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTodo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Date & Time</Label>
              <Input
                id="start"
                type="datetime-local"
                value={newTodo.start}
                onChange={(e) => setNewTodo({ ...newTodo, start: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newTodo.type}
                onValueChange={(value: TodoType) => setNewTodo({ ...newTodo, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMINDER">Reminder</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Reminder</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}