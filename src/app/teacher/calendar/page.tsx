'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfToday, parse, eachDayOfInterval, endOfMonth, startOfMonth, isToday, isSameMonth, isEqual, add, sub, getDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, GraduationCap, FileText, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import TeacherDashboardLayout from '@/components/teacher-dashboard/layout/TeacherDashboardLayout'
import { AddEventDialog } from '@/components/teacher-dashboard/AddEventDialog'
import { Toaster } from '@/components/ui/toaster'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: 'EXAM' | 'DEADLINE' | 'ASSIGNMENT' | 'MEETING' | 'REMINDER' | 'OTHER'
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startTime: string
  endTime?: string
  className?: string
  examDetails?: {
    title: string
    description?: string
    duration: number
  } | null
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const eventTypeIcons = {
  EXAM: FileText,
  DEADLINE: Clock,
  ASSIGNMENT: GraduationCap,
  MEETING: CalendarIcon,
  REMINDER: Bell,
  OTHER: CalendarIcon,
} as const

const eventTypeColors = {
  EXAM: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
  DEADLINE: 'bg-yellow-50 text-yellow-700 ring-yellow-600/10 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-400/20',
  ASSIGNMENT: 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
  MEETING: 'bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-400/20',
  REMINDER: 'bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-400/20',
  OTHER: 'bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-400/20',
} as const

type EventType = keyof typeof eventTypeIcons

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
]

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(startOfToday())
  const [currentMonth, setCurrentMonth] = useState(format(startOfToday(), 'MMM-yyyy'))
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())

  const days = eachDayOfInterval({
    start: startOfMonth(firstDayCurrentMonth),
    end: endOfMonth(firstDayCurrentMonth),
  })

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', format(firstDayCurrentMonth, 'yyyy'), format(firstDayCurrentMonth, 'M')],
    queryFn: async () => {
      const response = await fetch(
        `/api/teacher/calendar?month=${format(firstDayCurrentMonth, 'M')}&year=${format(firstDayCurrentMonth, 'yyyy')}`
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch calendar data')
      }
      const data = await response.json()
      return data
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 15000,
    retry: 3,
    retryDelay: 1000,
  })

  const eventsByDate = useMemo(() => {
    return (calendarData?.events || []).reduce((acc: Record<string, CalendarEvent[]>, event: CalendarEvent) => {
      const date = format(new Date(event.startTime), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(event)
      return acc
    }, {} as Record<string, CalendarEvent[]>)
  }, [calendarData?.events])

  const selectedDayEvents = useMemo(() => {
    return eventsByDate[format(selectedDay, 'yyyy-MM-dd')] || []
  }, [eventsByDate, selectedDay])

  const previousMonth = useCallback(() => {
    setCurrentMonth(format(sub(firstDayCurrentMonth, { months: 1 }), 'MMM-yyyy'))
  }, [firstDayCurrentMonth])

  const nextMonth = useCallback(() => {
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: 1 }), 'MMM-yyyy'))
  }, [firstDayCurrentMonth])

  if (isLoading) {
    return (
      <TeacherDashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View and manage your schedule
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-5">
              <Skeleton className="h-[600px] w-full" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-[600px] w-full" />
            </div>
          </div>
        </div>
      </TeacherDashboardLayout>
    )
  }

  return (
    <TeacherDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View and manage your schedule
            </p>
          </div>
          <AddEventDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Calendar */}
          <div className="col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {format(firstDayCurrentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={previousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 text-sm leading-6 text-muted-foreground">
              <div>S</div>
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
            </div>

            <div className="mt-2 grid grid-cols-7 text-sm">
              {days.map((day, dayIdx) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDate[dateKey] || []
                
                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      'relative py-2',
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      'border border-border'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-full',
                        isEqual(day, selectedDay) && 'bg-primary text-primary-foreground',
                        isToday(day) && !isEqual(day, selectedDay) && 'bg-muted text-muted-foreground',
                        !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && 'text-foreground',
                        !isEqual(day, selectedDay) && !isToday(day) && !isSameMonth(day, firstDayCurrentMonth) && 'text-muted-foreground',
                        dayEvents.length > 0 && !isEqual(day, selectedDay) && !isToday(day) && 'font-semibold'
                      )}
                    >
                      <time dateTime={format(day, 'yyyy-MM-dd')}>
                        {format(day, 'd')}
                      </time>
                    </button>

                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        <div className="flex -space-x-1">
                          {dayEvents.slice(0, 3).map((event: CalendarEvent) => {
                            const Icon = eventTypeIcons[event.type as EventType]
                            return (
                              <HoverCard key={event.id}>
                                <HoverCardTrigger>
                                  <div
                                    className={cn(
                                      'h-2 w-2 rounded-full ring-1 ring-inset',
                                      eventTypeColors[event.type as EventType]
                                    )}
                                  />
                                </HoverCardTrigger>
                                <HoverCardContent>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Icon className="h-4 w-4" />
                                      <span className="font-semibold">{event.title}</span>
                                    </div>
                                    {event.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {event.description}
                                      </p>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      {format(new Date(event.startTime), 'p')}
                                      {event.endTime && ` - ${format(new Date(event.endTime), 'p')}`}
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected day events */}
          <div className="col-span-2">
            <div className="rounded-lg bg-muted">
              <div className="px-4 py-3">
                <h2 className="font-semibold">
                  Schedule for{' '}
                  <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>
                    {format(selectedDay, 'MMM dd, yyy')}
                  </time>
                </h2>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="px-4 py-3">
                  {selectedDayEvents.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      No events scheduled for today.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayEvents.map((event: CalendarEvent) => {
                        const Icon = eventTypeIcons[event.type as EventType]
                        return (
                          <div
                            key={event.id}
                            className="flex items-start space-x-3 rounded-md border p-3"
                          >
                            <div
                              className={cn(
                                'mt-0.5 rounded-full p-1',
                                eventTypeColors[event.type as EventType]
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{event.title}</h3>
                                {event.className && (
                                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                    {event.className}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground">
                                  {event.description}
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(event.startTime), 'p')}
                                {event.endTime && ` - ${format(new Date(event.endTime), 'p')}`}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </TeacherDashboardLayout>
  )
} 