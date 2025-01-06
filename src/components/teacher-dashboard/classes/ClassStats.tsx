'use client'

import { ClassWithDetails } from '@/types/class'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, GraduationCap, Users } from 'lucide-react'

interface ClassStatsProps {
  classData: ClassWithDetails
}

export function ClassStats({ classData }: ClassStatsProps) {
  const stats = [
    {
      title: 'Total Students',
      value: classData._count.enrollments,
      icon: Users,
      description: 'Enrolled students',
    },
    {
      title: 'Total Exams',
      value: classData._count.exams,
      icon: FileText,
      description: 'Created exams',
    },
    {
      title: 'Average Score',
      value: '-- %',
      icon: GraduationCap,
      description: 'Class average',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
