import { useQuery } from '@tanstack/react-query'
import { DashboardData, DashboardResponse } from '@/types/dashboard'

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch('/api/teacher/dashboard')
  const json = (await response.json()) as DashboardResponse

  if (!json.success) {
    throw new Error(json.error)
  }

  return json.data
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 40000, // Refetch every 40 seconds
    retry: 1,
    staleTime: 10000, // Consider data stale after 10 seconds
  })
}
