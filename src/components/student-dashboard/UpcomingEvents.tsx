'use client'

import React from 'react'
import { CalendarDays, FileText, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'

interface Event {
  id: string
  title: string
  type: 'EXAM' | 'DEADLINE' | 'CLASS'
  startTime: string
  endTime?: string
}

interface UpcomingEventsProps {
  events: Event[]
}

const getEventIcon = (type: Event['type']) => {
  switch (type) {
    case 'EXAM':
      return <FileText className="h-4 w-4" />
    case 'CLASS':
      return <GraduationCap className="h-4 w-4" />
    case 'DEADLINE':
      return <CalendarDays className="h-4 w-4" />
  }
}

const getEventColor = (type: Event['type']) => {
  switch (type) {
    case 'EXAM':
      return 'text-red-500'
    case 'CLASS':
      return 'text-blue-500'
    case 'DEADLINE':
      return 'text-orange-500'
  }
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start space-x-3"
        >
          <div className={`mt-0.5 ${getEventColor(event.type)}`}>
            {getEventIcon(event.type)}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {event.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.startTime), 'PPP')}
              {event.endTime && ` - ${format(new Date(event.endTime), 'p')}`}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(event.startTime), 'p')}
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No upcoming events
        </p>
      )}
    </div>
  )
} 