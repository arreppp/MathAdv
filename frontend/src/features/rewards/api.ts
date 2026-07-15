import { apiClient } from '@/shared/api/client'

export interface DailyRewardStatus {
  reward: { id: number; name: string; xp_value: number } | null
  claimed_today: boolean
  message?: string
}

export async function fetchDailyReward(): Promise<DailyRewardStatus> {
  const { data } = await apiClient.get<DailyRewardStatus>('/rewards/daily')
  return data
}

export async function claimDailyReward(): Promise<{ message: string; xp_awarded: number }> {
  const { data } = await apiClient.post<{ message: string; xp_awarded: number }>('/rewards/daily/claim')
  return data
}
