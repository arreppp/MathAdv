import { supabase } from '@/shared/api/supabaseClient'

export interface DailyRewardStatus {
  reward: { id: number; name: string; xp_value: number } | null
  claimed_today: boolean
  message?: string
}

export async function fetchDailyReward(): Promise<DailyRewardStatus> {
  const { data, error } = await supabase.rpc('daily_reward_status')
  if (error) throw error
  return data as DailyRewardStatus
}

export async function claimDailyReward(): Promise<{ message: string; xp_awarded: number }> {
  const { data, error } = await supabase.rpc('claim_daily_reward')
  if (error) throw error
  return data as { message: string; xp_awarded: number }
}
