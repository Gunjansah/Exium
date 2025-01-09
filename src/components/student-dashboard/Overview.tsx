'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const options = {
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
      max: 100,
      ticks: {
        callback: (value: number) => `${value}%`,
      },
    },
  },
}

export function Overview() {
  // This would typically come from an API call
  const data = {
    labels: ['Math', 'Science', 'History', 'English', 'Physics'],
    datasets: [
      {
        label: 'Average Score',
        data: [85, 92, 78, 88, 95],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Class Average',
        data: [75, 88, 82, 85, 90],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="h-[350px]">
      <Bar options={options} data={data} />
    </div>
  )
} 