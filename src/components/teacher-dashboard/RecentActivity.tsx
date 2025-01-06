import { formatDistanceToNow } from 'date-fns'
import { FileText, MessageSquare, UserPlus, CheckCircle } from 'lucide-react'

interface Activity {
  id: string
  type: 'exam_created' | 'exam_completed' | 'student_joined' | 'feedback_received'
  message: string
  timestamp: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const activityIcons = {
  exam_created: FileText,
  exam_completed: CheckCircle,
  student_joined: UserPlus,
  feedback_received: MessageSquare,
}

const activityColors = {
  exam_created: 'text-blue-500',
  exam_completed: 'text-green-500',
  student_joined: 'text-purple-500',
  feedback_received: 'text-yellow-500',
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities.length) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type]
        const colorClass = activityColors[activity.type]

        return (
          <div key={activity.id} className="flex items-start gap-4">
            <div className={`mt-1 ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {activity.message}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
