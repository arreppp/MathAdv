import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { logoutRequest } from '@/features/auth/api'
import { fetchDashboardSummary } from '@/features/dashboard/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { usePlayerStore } from '@/shared/stores/playerStore'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ProgressBar } from '@/shared/ui/ProgressBar'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const xp = usePlayerStore((state) => state.xp)
  const level = usePlayerStore((state) => state.level)
  const setPlayerStats = usePlayerStore((state) => state.setPlayerStats)

  const summaryQuery = useQuery({ queryKey: ['dashboard-summary'], queryFn: fetchDashboardSummary })

  useEffect(() => {
    if (summaryQuery.data) setPlayerStats(summaryQuery.data.student)
  }, [summaryQuery.data, setPlayerStats])

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })

  // Fall back to the login-time snapshot until the live summary loads, so
  // there's no flash of 0/1 for a returning player.
  const displayXp = summaryQuery.data ? xp : (user?.student?.xp ?? 0)
  const displayLevel = summaryQuery.data ? level : (user?.student?.level ?? 1)
  const xpIntoLevel = displayXp % 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="text-center">
          <h1 className="font-display text-2xl font-extrabold text-adventure-700">Welcome back, {user?.name}!</h1>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div>
              <p className="font-display text-3xl font-extrabold text-gold-600">{displayLevel}</p>
              <p className="text-sm text-adventure-600">Level</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold text-adventure-600">{displayXp}</p>
              <p className="text-sm text-adventure-600">Total XP</p>
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold text-magic-600">
                {summaryQuery.data?.levels_completed ?? 0}
              </p>
              <p className="text-sm text-adventure-600">Levels Completed</p>
            </div>
          </div>

          <div className="mt-6">
            <ProgressBar value={xpIntoLevel} max={100} label={`Progress to level ${displayLevel + 1}`} />
          </div>

          <Link
            to="/play"
            className="font-display mt-6 inline-block rounded-2xl bg-adventure-500 px-5 py-2.5 font-semibold text-white shadow-md shadow-adventure-900/20 transition-transform hover:bg-adventure-600 active:scale-95"
          >
            Play World 1
          </Link>

          <div className="mt-4 flex justify-center gap-4 text-sm">
            <Link to="/leaderboard" className="font-display font-semibold text-adventure-700 hover:underline">
              Leaderboard
            </Link>
            <Link to="/achievements" className="font-display font-semibold text-adventure-700 hover:underline">
              Achievements
            </Link>
            <Link to="/rewards" className="font-display font-semibold text-adventure-700 hover:underline">
              Daily Reward
            </Link>
          </div>

          <Button
            variant="ghost"
            className="mt-3 block"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Log Out
          </Button>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-adventure-700">Recent Activity</h2>
          {summaryQuery.isLoading && <p className="mt-2 text-sm text-adventure-600">Loading...</p>}
          {summaryQuery.data?.recent_activity.length === 0 && (
            <p className="mt-2 text-sm text-adventure-600">No activity yet - go play World 1!</p>
          )}
          <ul className="mt-2 space-y-2">
            {summaryQuery.data?.recent_activity.map((activity, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-xl bg-adventure-50 px-3 py-2 text-sm"
              >
                <span className="text-adventure-800">{activity.description}</span>
                <span className="text-adventure-500">{new Date(activity.created_at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
