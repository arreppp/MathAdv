import { supabase } from '@/shared/api/supabaseClient'

export interface LeaderboardEntry {
  rank: number
  student_id: number
  name: string
  xp: number
  level: number
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('leaderboard', { p_scope: 'global', p_class_id: null })
  if (error) throw error
  return (data as { entries: LeaderboardEntry[] }).entries
}
