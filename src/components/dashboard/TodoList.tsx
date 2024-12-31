'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Calendar as CalendarIcon, Trash2, Clock, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, addMonths, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type TodoPriority = 'HIGH' | 'MEDIUM' | 'LOW'
type TodoStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type TodoType = 'EXAM' | 'DEADLINE' | 'ASSIGNMENT' | 'MEETING' | 'REMINDER' | 'OTHER'

interface Todo {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string | null
  type: TodoType
  status: TodoStatus
  priority?: TodoPriority
  class?: {
    id: string
    name: string
    code: string
  }
  exam?: {
    id: string
    title: string
    duration: number
  }
}

export default function TodoList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(addMonths(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    type: 'REMINDER' as TodoType,
    status: 'UPCOMING' as TodoStatus
  })

  const fetchTodos = async () => {
    setLoading(true)
    setError(null)
    try {
      const start = startOfDay(new Date()).toISOString()
      const end = endOfDay(addMonths(new Date(), 3)).toISOString()
      
      const response = await fetch(`/api/student/calendar-events?start=${start}&end=${end}&include=class`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      const todosWithPriority = data.map((todo: Todo) => ({
        ...todo,
        priority: getPriority(new Date(todo.startTime))
      }))

      const sortedTodos = todosWithPriority.sort((a: Todo, b: Todo) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1
        if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return -1
        
        const dateA = new Date(a.startTime)
        const dateB = new Date(b.startTime)
        if (dateA.getTime() === dateB.getTime()) {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
          return priorityOrder[a.priority || 'LOW'] - priorityOrder[b.priority || 'LOW']
        }
        return dateA.getTime() - dateB.getTime()
      })

      setTodos(sortedTodos)
    } catch (err) {
      console.error('Error fetching todos:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
    // Set up polling for real-time updates
    const interval = setInterval(fetchTodos, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

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
        body: JSON.stringify({
          title: newTodo.title,
          description: newTodo.description,
          startTime: new Date(newTodo.start).toISOString(),
          endTime: new Date(newTodo.end).toISOString(),
          type: newTodo.type,
          status: newTodo.status
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      toast.success('Task created successfully')
      setShowAddDialog(false)
      setNewTodo({
        title: '',
        description: '',
        start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: format(addMonths(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        type: 'REMINDER',
        status: 'UPCOMING'
      })
      await fetchTodos()
      router.refresh() // Refresh the page to update the calendar
    } catch (err) {
      console.error('Error creating todo:', err)
      toast.error('Failed to create task')
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/student/calendar-events?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      toast.success('Task deleted successfully')
      await fetchTodos()
      router.refresh() // Refresh the page to update the calendar
    } catch (err) {
      console.error('Error deleting todo:', err)
      toast.error('Failed to delete task')
    }
  }

  const handleToggleStatus = async (todo: Todo) => {
    try {
      const newStatus = todo.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED'
      const response = await fetch(`/api/student/calendar-events?id=${todo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update task status')
      }

      toast.success('Task status updated')
      await fetchTodos()
      router.refresh() // Refresh the page to update the calendar
    } catch (err) {
      console.error('Error updating todo status:', err)
      toast.error('Failed to update task status')
    }
  }

  const getTypeStyles = (type: TodoType, status: TodoStatus) => {
    const baseStyles = status === 'COMPLETED' 
      ? 'bg-gray-50 border-gray-200 text-gray-500'
      : ''

    switch (type) {
      case 'EXAM':
        return cn('bg-red-50 border-red-200 text-red-700', baseStyles)
      case 'ASSIGNMENT':
        return cn('bg-blue-50 border-blue-200 text-blue-700', baseStyles)
      case 'DEADLINE':
        return cn('bg-yellow-50 border-yellow-200 text-yellow-700', baseStyles)
      case 'MEETING':
        return cn('bg-purple-50 border-purple-200 text-purple-700', baseStyles)
      default:
        return cn('bg-gray-50 border-gray-200 text-gray-700', baseStyles)
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
          <p className="text-sm text-gray-500">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Loader2 className="w-5 h-5" />
          <h3 className="font-medium">Error loading tasks</h3>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Deadlines & Tasks</h2>
        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {todos.length === 0 ? (
        <div className="text-center py-8 bg-gray-50/50 rounded-lg">
          <p className="text-gray-600">No upcoming tasks</p>
          <p className="text-sm text-gray-500 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200',
                getTypeStyles(todo.type, todo.status)
              )}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(todo)}
                      className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors duration-200',
                        todo.status === 'COMPLETED'
                          ? 'border-gray-400 bg-gray-400 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {todo.status === 'COMPLETED' && (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                    <h3 className={cn(
                      'font-medium truncate',
                      todo.status === 'COMPLETED' && 'line-through text-gray-500'
                    )}>
                      {todo.title}
                    </h3>
                    {todo.priority && todo.status !== 'COMPLETED' && (
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        getPriorityStyles(todo.priority)
                      )}>
                        {todo.priority}
                      </span>
                    )}
                  </div>
                  
                  {todo.class && (
                    <p className="text-sm mt-0.5 text-gray-600">
                      {todo.class.name} ({todo.class.code})
                    </p>
                  )}
                  
                  {todo.description && (
                    <p className="text-sm mt-1 text-gray-600 line-clamp-2">
                      {todo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(new Date(todo.startTime), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{format(new Date(todo.startTime), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="flex-shrink-0 p-1 hover:text-red-600 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTodo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={newTodo.start}
                  onChange={(e) => setNewTodo({ ...newTodo, start: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={newTodo.end}
                  onChange={(e) => setNewTodo({ ...newTodo, end: e.target.value })}
                  required
                />
              </div>
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
                  <SelectItem value="DEADLINE">Deadline</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="REMINDER">Reminder</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}