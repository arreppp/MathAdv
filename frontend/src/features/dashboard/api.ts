import { apiClient } from '@/shared/api/client'

interface ActivityLogEntry {
  type: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface DashboardSummary {
  student: { xp: number; level: number }
  levels_completed: number
  recent_activity: ActivityLogEntry[]
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/dashboard')
  return data
}
