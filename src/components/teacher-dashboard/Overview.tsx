'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useQuery } from '@tanstack/react-query'

interface OverviewStats {
  data: Array<{
    name: string
    total: number
  }>
}

export function Overview() {
  const { data: stats } = useQuery<OverviewStats>({
    queryKey: ['teacherOverview'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/dashboard/overview')
      if (!response.ok) {
        throw new Error('Failed to fetch overview data')
      }
      return response.json()
    },
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={stats?.data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
