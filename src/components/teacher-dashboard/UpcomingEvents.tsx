import { CalendarDays, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface Event {
  id: string
  title: string
  type: 'EXAM' | 'DEADLINE' | 'MEETING'
  startTime: string
  endTime?: string
}

interface UpcomingEventsProps {
  events: Event[]
}

const eventTypeColors = {
  EXAM: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  DEADLINE: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  MEETING: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
} as const

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (!events.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No upcoming events
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {events.map((event) => (
        <div key={event.id} className="flex items-start space-x-4">
          <div className="mt-1">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{event.title}</p>
              <Badge
                variant="secondary"
                className={eventTypeColors[event.type]}
              >
                {event.type.toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              <span>
                {format(new Date(event.startTime), 'PPp')}
                {event.endTime &&
                  ` - ${format(new Date(event.endTime), 'p')}`}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
