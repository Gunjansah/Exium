'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Scale,
  CoreScaleOptions,
  Tick,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(this: Scale<CoreScaleOptions>, value: number | string) {
          return `${value}%`
        },
      },
    },
  },
}

interface LineChartProps {
  data: ChartData<'line'>
  options?: ChartOptions<'line'>
}

interface BarChartProps {
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
}

export function LineChart({ data, options = {} }: LineChartProps) {
  const lineOptions: ChartOptions<'line'> = {
    ...commonOptions,
    ...options,
  }
  
  return (
    <Line
      options={lineOptions}
      data={data}
    />
  )
}

export function BarChart({ data, options = {} }: BarChartProps) {
  const barOptions: ChartOptions<'bar'> = {
    ...commonOptions,
    ...options,
  }
  
  return (
    <Bar
      options={barOptions}
      data={data}
    />
  )
} 