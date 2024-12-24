'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addDays } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

interface Event {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  type: 'EXAM' | 'DEADLINE' | 'ASSIGNMENT' | 'MEETING' | 'REMINDER' | 'OTHER'
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

interface CalendarProps {
  className?: string
}

export default function Calendar({ className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    type: 'REMINDER' as Event['type'],
    status: 'UPCOMING' as Event['status']
  })
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  // Fetch events for the current month
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)
        
        const response = await fetch(
          `/api/student/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        
        const data = await response.json()
        setEvents(data.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching events:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [currentDate])

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

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
      const response = await fetch('/api/student/calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startTime: new Date(newEvent.start).toISOString(),
          endTime: new Date(newEvent.end).toISOString(),
          type: newEvent.type,
          status: newEvent.status
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to create event')
      }

      // Refresh events
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const eventsResponse = await fetch(
        `/api/student/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}`
      )
      
      if (!eventsResponse.ok) {
        throw new Error('Failed to refresh events')
      }
      
      const data = await eventsResponse.json()
      setEvents(data.map((event: any) => ({
        ...event,
        start: new Date(event.startTime),
        end: new Date(event.endTime)
      })))

      // Reset form and close dialog
      setNewEvent({
        title: '',
        description: '',
        start: '',
        end: '',
        type: 'REMINDER',
        status: 'UPCOMING'
      })
      setIsAddEventOpen(false)
    } catch (err) {
      console.error('Error creating event:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/student/calendar-events/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      // Refresh events
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const eventsResponse = await fetch(
        `/api/student/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}`
      )
      
      if (!eventsResponse.ok) {
        throw new Error('Failed to refresh events')
      }
      
      const data = await eventsResponse.json()
      setEvents(data.map((event: any) => ({
        ...event,
        start: new Date(event.startTime),
        end: new Date(event.endTime)
      })))

      setShowEventDetails(false)
      setSelectedEvent(null)
    } catch (err) {
      console.error('Error deleting event:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p>Error loading calendar: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={goToToday}
            className="text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              setSelectedDate(new Date())
              setIsAddEventOpen(true)
            }}
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((day, dayIdx) => {
          const dayEvents = events.filter(event => 
            format(event.start, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          )

          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[100px] bg-white p-2 relative cursor-pointer hover:bg-gray-50 transition-colors duration-200",
                !isSameMonth(day, currentDate) && "bg-gray-50 text-gray-400",
                isToday(day) && "bg-blue-50"
              )}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isToday(day) && "bg-blue-600 text-white"
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs font-medium text-blue-600">
                    {dayEvents.length} events
                  </span>
                )}
              </div>
              
              {/* Events List */}
              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                {dayEvents.map((event, eventIdx) => (
                  <div
                    key={event.id}
                    className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 truncate hover:bg-blue-200 transition-colors duration-200 cursor-pointer"
                    title={`${event.title}\n${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'your calendar'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Enter event description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Time</Label>
                  <Input 
                    id="start" 
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Time</Label>
                  <Input 
                    id="end" 
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value: Event['type']) => setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger className="mt-1.5">
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
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddEventOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Event</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEvent?.description && (
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedEvent && format(selectedEvent.start, 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <Label>End Time</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedEvent && format(selectedEvent.end, 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {selectedEvent?.type.toLowerCase()}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEventDetails(false)}
              >
                Close
              </Button>
              {selectedEvent?.type === 'EXAM' && selectedEvent.status === 'UPCOMING' && (
                <Button
                  variant="default"
                  onClick={() => {
                    window.location.href = `/student_dashboard/exam/disclaimer?id=${selectedEvent.id}`
                  }}
                  className="gap-2"
                >
                  Start Exam
                </Button>
              )}
              {selectedEvent && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 