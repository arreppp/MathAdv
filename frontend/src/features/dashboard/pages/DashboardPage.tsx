import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { logoutRequest } from '@/features/auth/api'
import { fetchDashboardSummary } from '@/features/dashboard/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { usePlayerStore } from '@/shared/stores/playerStore'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cx } from '@/shared/ui/cx'

const ACTIVITY_ICON: Record<string, string> = {
  question_answered: '✅',
  level_completed: '🏆',
}

const QUICK_ACTIONS = [
  {
    to: '/leaderboard',
    icon: '🏆',
    label: 'Leaderboard',
    hint: 'See top adventurers',
    accent: 'from-gold-300 to-gold-500',
  },
  {
    to: '/achievements',
    icon: '🎖️',
    label: 'Achievements',
    hint: 'Badges & milestones',
    accent: 'from-magic-300 to-magic-500',
  },
  {
    to: '/rewards',
    icon: '🎁',
    label: 'Daily Reward',
    hint: 'Claim your bonus XP',
    accent: 'from-adventure-300 to-adventure-500',
  },
] as const

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
  const xpToNextLevel = 100 - xpIntoLevel
  const levelsCompleted = summaryQuery.data?.levels_completed ?? 0
  const initial = (user?.name ?? '?').trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-adventure-700">
            Welcome back, <span className="text-adventure-900">{user?.name}</span>!
          </p>
          <Button
            variant="ghost"
            className="!px-3 !py-1.5 text-sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Log Out
          </Button>
        </div>

        <Card className="relative overflow-hidden bg-gradient-to-br from-adventure-600 via-adventure-500 to-magic-500 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10" />

          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-gold-300 bg-adventure-800 font-display text-2xl font-extrabold shadow-lg">
                {initial}
              </div>
              <div className="font-display absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-2 py-0.5 text-xs font-extrabold text-adventure-900 shadow">
                Lv {displayLevel}
              </div>
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold">{user?.name}'s Quest Log</h1>
              <p className="text-sm text-white/80">
                {xpToNextLevel} XP to reach level {displayLevel + 1}
              </p>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="h-4 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-[width] duration-700"
                style={{ width: `${Math.min(100, Math.round((xpIntoLevel / 100) * 100))}%` }}
              >
                <div className="absolute inset-0 animate-pulse bg-white/20" />
              </div>
            </div>
            <div className="mt-1 flex justify-between text-xs font-semibold text-white/80">
              <span>{xpIntoLevel} XP</span>
              <span>100 XP</span>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 py-3 backdrop-blur-sm">
              <p className="font-display text-2xl font-extrabold text-gold-200">{displayLevel}</p>
              <p className="text-xs text-white/80">Level</p>
            </div>
            <div className="rounded-2xl bg-white/10 py-3 backdrop-blur-sm">
              <p className="font-display text-2xl font-extrabold text-gold-200">{displayXp}</p>
              <p className="text-xs text-white/80">Total XP</p>
            </div>
            <div className="rounded-2xl bg-white/10 py-3 backdrop-blur-sm">
              <p className="font-display text-2xl font-extrabold text-gold-200">{levelsCompleted}</p>
              <p className="text-xs text-white/80">Levels Beat</p>
            </div>
          </div>

          <Link
            to="/play"
            className="font-display relative mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gold-400 px-5 py-3 font-extrabold text-adventure-900 shadow-md shadow-adventure-900/30 transition-transform hover:bg-gold-300 active:scale-95"
          >
            <span className="text-lg">▶️</span> Continue Your Quest
          </Link>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={cx(
                'group flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br p-4 text-center shadow-md shadow-adventure-900/10 transition-transform hover:-translate-y-1 active:scale-95',
                action.accent,
              )}
            >
              <span className="text-2xl drop-shadow transition-transform group-hover:scale-110">{action.icon}</span>
              <span className="font-display text-sm font-extrabold text-white">{action.label}</span>
              <span className="text-[11px] text-white/85">{action.hint}</span>
            </Link>
          ))}
        </div>

        <Card>
          <h2 className="font-display text-lg font-bold text-adventure-700">Recent Activity</h2>
          {summaryQuery.isLoading && <p className="mt-2 text-sm text-adventure-600">Loading...</p>}
          {summaryQuery.data?.recent_activity.length === 0 && (
            <p className="mt-2 text-sm text-adventure-600">No activity yet - go play World 1!</p>
          )}
          <ul className="mt-3 space-y-2">
            {summaryQuery.data?.recent_activity.map((activity, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-xl bg-adventure-50 px-3 py-2 text-sm transition-colors hover:bg-adventure-100"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm">
                  {ACTIVITY_ICON[activity.type] ?? '⭐'}
                </span>
                <span className="flex-1 text-adventure-800">{activity.description}</span>
                <span className="shrink-0 text-xs text-adventure-500">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
