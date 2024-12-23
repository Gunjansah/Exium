'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

type TodoPriority = 'HIGH' | 'MEDIUM' | 'LOW'
type TodoStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface Todo {
  id: string
  title: string
  description?: string
  dueDate: string
  priority: TodoPriority
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  type: 'EXAM' | 'DEADLINE' | 'ASSIGNMENT' | 'MEETING' | 'REMINDER' | 'OTHER'
}

export default function TodoList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    priority: 'MEDIUM' as TodoPriority,
    type: 'REMINDER' as Todo['type']
  })

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/student/calendar-events')
      if (!response.ok) throw new Error('Failed to fetch todos')
      const data = await response.json()
      
      // Convert calendar events to todos
      const sortedTodos = data
        .map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          dueDate: event.startTime,
          priority: getPriority(new Date(event.startTime)),
          status: event.status || 'UPCOMING',
          type: event.type || 'REMINDER'
        }))
        .sort((a: Todo, b: Todo) => {
          // Sort by priority first
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          }
          // Then by due date
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })

      setTodos(sortedTodos)
    } catch (err) {
      console.error('Error fetching todos:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
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
        body: JSON.stringify({
          title: newTodo.title,
          description: newTodo.description,
          startTime: new Date(newTodo.dueDate).toISOString(),
          endTime: new Date(newTodo.dueDate).toISOString(), // For todos, end time is same as start time
          type: newTodo.type,
          status: 'UPCOMING'
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to create todo')
      }

      // Refresh todos
      await fetchTodos()

      // Reset form and close dialog
      setNewTodo({
        title: '',
        description: '',
        dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        priority: 'MEDIUM',
        type: 'REMINDER'
      })
      setShowAddDialog(false)

    } catch (err) {
      console.error('Error creating todo:', err)
      setError(err instanceof Error ? err.message : 'Failed to create todo')
    }
  }

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getTypeIcon = (type: Todo['type']) => {
    switch (type) {
      case 'EXAM':
        return '📝'
      case 'DEADLINE':
        return '⏰'
      case 'ASSIGNMENT':
        return '📚'
      case 'MEETING':
        return '👥'
      case 'REMINDER':
        return '🔔'
      default:
        return '📌'
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/student/calendar-events/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      // Refresh todos after deletion
      await fetchTodos()
    } catch (err) {
      console.error('Error deleting todo:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete task')
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Tasks & Deadlines</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <Button size="sm" className="gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTodo} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  required
                  placeholder="Enter task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newTodo.type}
                    onValueChange={(value: Todo['type']) => setNewTodo({ ...newTodo, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMINDER">Reminder</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                      <SelectItem value="DEADLINE">Deadline</SelectItem>
                      <SelectItem value="EXAM">Exam</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchTodos}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 rounded-lg">
            <p className="text-gray-500">No tasks yet</p>
            <p className="text-sm text-gray-400">Add your first task to get started</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow transition-shadow duration-200"
            >
              <div className="text-xl">{getTypeIcon(todo.type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{todo.title}</h3>
                {todo.description && (
                  <p className="text-sm text-gray-500 truncate">{todo.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(todo.priority)}`}>
                  {todo.priority}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(todo.dueDate), 'MMM d, HH:mm')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTodo(todo.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 