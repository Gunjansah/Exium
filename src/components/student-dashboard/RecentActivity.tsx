'use client'

import React from 'react'
import { FileText, GraduationCap, MessageSquare } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'exam_started' | 'exam_completed' | 'class_joined' | 'feedback_received'
  message: string
  timestamp: string
}

interface RecentActivityProps {
  activities: Activity[]
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'exam_started':
    case 'exam_completed':
      return <FileText className="h-4 w-4" />
    case 'class_joined':
      return <GraduationCap className="h-4 w-4" />
    case 'feedback_received':
      return <MessageSquare className="h-4 w-4" />
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'exam_started':
      return 'text-blue-500'
    case 'exam_completed':
      return 'text-green-500'
    case 'class_joined':
      return 'text-purple-500'
    case 'feedback_received':
      return 'text-orange-500'
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-3"
        >
          <div className={`mt-0.5 ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm leading-none">
              {activity.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(activity.timestamp), 'HH:mm')}
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent activity
        </p>
      )}
    </div>
  )
} 