import { supabase } from '@/shared/api/supabaseClient'

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
  const { data, error } = await supabase.rpc('dashboard_summary')
  if (error) throw error
  return data as DashboardSummary
}
