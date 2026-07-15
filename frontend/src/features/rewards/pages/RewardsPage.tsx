import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { claimDailyReward, fetchDailyReward } from '@/features/rewards/api'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

export function RewardsPage() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['daily-reward'], queryFn: fetchDailyReward })

  const claimMutation = useMutation({
    mutationFn: claimDailyReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reward'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/dashboard" className="font-display text-sm font-semibold text-adventure-700 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display mt-2 text-center text-2xl font-extrabold text-adventure-700">Daily Reward</h1>

        <Card className="mt-6 text-center">
          {query.isLoading && <p className="text-adventure-600">Loading...</p>}
          {query.data && !query.data.reward && (
            <p className="text-adventure-600">{query.data.message ?? 'No daily reward is configured yet.'}</p>
          )}
          {query.data?.reward && (
            <>
              <p className="font-display text-lg font-bold text-adventure-800">{query.data.reward.name}</p>
              <p className="mt-1 text-adventure-600">+{query.data.reward.xp_value} XP</p>
              <Button
                className="mt-4"
                disabled={query.data.claimed_today || claimMutation.isPending}
                onClick={() => claimMutation.mutate()}
              >
                {query.data.claimed_today ? 'Already Claimed Today' : 'Claim Reward'}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
