'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addDays } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  type: 'EXAM' | 'DEADLINE' | 'ASSIGNMENT' | 'MEETING' | 'REMINDER' | 'OTHER'
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  userId: string
  classId?: string
  examId?: string
  class?: {
    id: string
    name: string
    code: string
  }
}

interface CalendarEvent extends Event {
  start: Date
  end: Date
}

interface CalendarProps {
  className?: string
}

export default function Calendar({ className }: CalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    type: 'REMINDER' as Event['type'],
    status: 'UPCOMING' as Event['status']
  })

  // Fetch events for the current month
  const fetchEvents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      
      const response = await fetch(
        `/api/student/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}&include=class`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      
      const data: Event[] = await response.json()
      const validEvents = data
        .map(event => {
          try {
            const startDate = new Date(event.startTime)
            const endDate = new Date(event.endTime)

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.error('Invalid date in event:', event)
              return null
            }

            return {
              ...event,
              start: startDate,
              end: endDate
            }
          } catch (err) {
            console.error('Error processing event:', err)
            return null
          }
        })
        .filter((event): event is CalendarEvent => event !== null)

      setEvents(validEvents)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    // Set up polling for real-time updates
    const interval = setInterval(fetchEvents, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [currentDate])

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const startDateTime = new Date(date)
    startDateTime.setHours(9, 0, 0) // Set default time to 9:00 AM
    
    const endDateTime = new Date(date)
    endDateTime.setHours(10, 0, 0) // Set default duration to 1 hour

    setNewEvent({
      ...newEvent,
      start: format(startDateTime, "yyyy-MM-dd'T'HH:mm"),
      end: format(endDateTime, "yyyy-MM-dd'T'HH:mm")
    })
    setIsAddEventOpen(true)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const startTime = new Date(newEvent.start)
      const endTime = new Date(newEvent.end)

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid date format')
      }

      if (endTime < startTime) {
        throw new Error('End time must be after start time')
      }

      const response = await fetch('/api/student/calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          type: newEvent.type,
          status: 'UPCOMING'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      toast.success('Event created successfully')
      setIsAddEventOpen(false)
      setNewEvent({
        title: '',
        description: '',
        start: '',
        end: '',
        type: 'REMINDER',
        status: 'UPCOMING'
      })
      await fetchEvents()
      router.refresh() // Refresh the page to update the todo list
    } catch (err) {
      console.error('Error creating event:', err)
      toast.error('Failed to create event')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/student/calendar-events?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      toast.success('Event deleted successfully')
      await fetchEvents()
      router.refresh() // Refresh the page to update the todo list
    } catch (err) {
      console.error('Error deleting event:', err)
      toast.error('Failed to delete event')
    }
  }

  const handleToggleStatus = async (event: CalendarEvent) => {
    try {
      const newStatus = event.status === 'COMPLETED' ? 'UPCOMING' : 'COMPLETED'
      const response = await fetch(`/api/student/calendar-events?id=${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update event status')
      }

      toast.success('Event status updated')
      await fetchEvents()
      router.refresh() // Refresh the page to update the todo list
    } catch (err) {
      console.error('Error updating event status:', err)
      toast.error('Failed to update event status')
    }
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const getEventStyles = (type: Event['type'], status: Event['status']) => {
    const baseStyles = status === 'COMPLETED'
      ? 'opacity-50'
      : ''

    switch (type) {
      case 'EXAM':
        return cn('bg-red-100 text-red-800 border-red-200', baseStyles)
      case 'DEADLINE':
        return cn('bg-yellow-100 text-yellow-800 border-yellow-200', baseStyles)
      case 'ASSIGNMENT':
        return cn('bg-blue-100 text-blue-800 border-blue-200', baseStyles)
      case 'MEETING':
        return cn('bg-purple-100 text-purple-800 border-purple-200', baseStyles)
      case 'REMINDER':
        return cn('bg-green-100 text-green-800 border-green-200', baseStyles)
      default:
        return cn('bg-gray-100 text-gray-800 border-gray-200', baseStyles)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goToToday}
            className="ml-2"
          >
            Today
          </Button>
          <h2 className="text-lg font-semibold ml-4">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <Button
          onClick={() => handleDateClick(new Date())}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Calendar header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, dayIdx) => {
          const dayEvents = events.filter(event => 
            format(event.start, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          )

          return (
            <div
              key={day.toString()}
              className={cn(
                'min-h-[120px] bg-white p-2',
                !isSameMonth(day, currentDate) && 'bg-gray-50 text-gray-500',
                'relative group'
              )}
              onClick={() => handleDateClick(day)}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn(
                  'ml-auto flex h-6 w-6 items-center justify-center rounded-full text-sm',
                  isToday(day) && 'bg-blue-600 text-white',
                  !isToday(day) && 'text-gray-900'
                )}
              >
                {format(day, 'd')}
              </time>

              <div className="space-y-1 mt-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md border cursor-pointer transition-all duration-200',
                      getEventStyles(event.type, event.status)
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStatus(event)
                        }}
                        className={cn(
                          'w-3 h-3 rounded-full border transition-colors duration-200',
                          event.status === 'COMPLETED'
                            ? 'border-current bg-current'
                            : 'border-current hover:bg-current/10'
                        )}
                      >
                        {event.status === 'COMPLETED' && (
                          <CheckCircle2 className="w-2 h-2 text-white" />
                        )}
                      </button>
                      <span className={cn(
                        'truncate',
                        event.status === 'COMPLETED' && 'line-through opacity-50'
                      )}>
                        {event.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span>{format(event.start, 'HH:mm')}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEvent(event.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Enter event description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value: Event['type']) => setNewEvent({ ...newEvent, type: value })}
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
                onClick={() => setIsAddEventOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Event</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                )}
              </div>
              
              {selectedEvent.class && (
                <div className="text-sm">
                  <span className="font-medium">Class:</span>{' '}
                  {selectedEvent.class.name} ({selectedEvent.class.code})
                </div>
              )}
              
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Start:</span>{' '}
                  {format(selectedEvent.start, 'PPP p')}
                </div>
                <div>
                  <span className="font-medium">End:</span>{' '}
                  {format(selectedEvent.end, 'PPP p')}
                </div>
                <div>
                  <span className="font-medium">Type:</span>{' '}
                  {selectedEvent.type.charAt(0) + selectedEvent.type.slice(1).toLowerCase()}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  {selectedEvent.status.charAt(0) + selectedEvent.status.slice(1).toLowerCase()}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleToggleStatus(selectedEvent)}
                >
                  Mark as {selectedEvent.status === 'COMPLETED' ? 'Incomplete' : 'Complete'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteEvent(selectedEvent.id)
                    setShowEventDetails(false)
                  }}
                >
                  Delete Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 