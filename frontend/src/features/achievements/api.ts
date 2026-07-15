import { supabase } from '@/shared/api/supabaseClient'

export interface AchievementEntry {
  id: number
  name: string
  description: string | null
  icon: string | null
  xp_reward: number
  earned: boolean
}

export interface BadgeEntry {
  id: number
  name: string
  description: string | null
  icon: string | null
  rarity: string
  earned: boolean
}

interface AchievementsResponse {
  achievements: AchievementEntry[]
  badges: BadgeEntry[]
}

export async function fetchAchievements(): Promise<AchievementsResponse> {
  const { data, error } = await supabase.rpc('list_achievements')
  if (error) throw error
  return data as AchievementsResponse
}
