import { apiClient } from '@/shared/api/client'

export interface LeaderboardEntry {
  rank: number
  student_id: number
  name: string
  xp: number
  level: number
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<{ entries: LeaderboardEntry[] }>('/leaderboard')
  return data.entries
}
