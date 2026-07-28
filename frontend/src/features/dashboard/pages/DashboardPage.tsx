import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchAchievements } from '@/features/achievements/api'
import { logoutRequest } from '@/features/auth/api'
import { fetchDashboardSummary } from '@/features/dashboard/api'
import { fetchLeaderboard } from '@/features/leaderboard/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { usePlayerStore } from '@/shared/stores/playerStore'
import { cx } from '@/shared/ui/cx'

const ACTIVITY_ICON: Record<string, string> = {
  question_answered: '✅',
  level_completed: '🏆',
}

const MENU_ITEMS = [
  { key: 'play', label: 'Play', to: '/play' },
  { key: 'leaderboard', label: 'Leaderboard', to: null },
  { key: 'quit', label: 'Quit', to: null },
] as const

function MenuButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-display w-40 rounded-xl border-4 border-[#6d2440] bg-gold-300 py-2.5 text-lg font-extrabold tracking-widest text-adventure-900 shadow-[4px_4px_0_0_#6d2440] transition-all hover:brightness-105 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none sm:w-48 sm:py-3 sm:text-xl"
    >
      {children}
    </button>
  )
}

function HudButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 rounded-xl border-4 border-[#6d2440] bg-gold-300 px-2.5 py-2 shadow-[3px_3px_0_0_#6d2440] transition-all hover:brightness-105 active:translate-x-1 active:translate-y-1 active:shadow-none sm:px-3.5 sm:py-2.5"
    >
      <span className="text-xl sm:text-2xl">{icon}</span>
      <span className="font-display text-center text-[9px] font-extrabold leading-tight text-adventure-900 sm:text-[10px]">
        {label}
      </span>
    </button>
  )
}

function DashboardDialog({
  title,
  onClose,
  widthClass = 'max-w-sm',
  children,
}: {
  title: string
  onClose: () => void
  widthClass?: string
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className={cx(
          'max-h-[80vh] w-full overflow-y-auto rounded-3xl border-2 border-adventure-200 bg-white p-5 shadow-xl',
          widthClass,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-adventure-700">{title}</h2>
          <button
            onClick={onClose}
            className="font-display text-adventure-500 hover:text-adventure-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const xp = usePlayerStore((state) => state.xp)
  const level = usePlayerStore((state) => state.level)
  const setPlayerStats = usePlayerStore((state) => state.setPlayerStats)
  const [showActivity, setShowActivity] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const isGuest = !user

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    enabled: !isGuest,
  })
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    enabled: !isGuest && showLeaderboard,
  })
  const achievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
    enabled: !isGuest && showAchievements,
  })

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
  const initial = (user?.name ?? '?').trim().charAt(0).toUpperCase()

  const visibleMenuItems = isGuest ? MENU_ITEMS.filter((item) => item.key !== 'quit') : MENU_ITEMS

  const handleMenuClick = (item: (typeof MENU_ITEMS)[number]) => {
    if (isGuest) return setShowLoginPrompt(true)
    if (item.key === 'quit') return logoutMutation.mutate()
    if (item.key === 'leaderboard') return setShowLeaderboard(true)
    if (item.to) navigate(item.to)
  }

  const handleHudClick = (open: () => void) => {
    if (isGuest) return setShowLoginPrompt(true)
    open()
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#16302a]">
      <div className="relative z-20 shrink-0 border-b-4 border-black/20 bg-gradient-to-r from-[#3f1524] via-[#6d2440] to-[#3f1524] px-4 py-2 text-center shadow-md">
        <p className="font-display text-xs font-bold tracking-wide text-gold-200 drop-shadow sm:text-base">
          Welcome, <span className="text-white">{user?.name ?? 'Adventurer'}</span>! Let's Embark on the Maths
          Journey Together!
        </p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#16302a]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-repeat-x sm:h-48"
          style={{ backgroundImage: "url('/pixel/tree-tile.svg')", backgroundSize: '96px 216px' }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-repeat sm:h-9"
          style={{ backgroundImage: "url('/pixel/ground-tile.svg')", backgroundSize: '33px 33px' }}
        />

        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 sm:top-6">
          <div className="mx-auto h-6 w-1.5 bg-[#5a3a22]" />
          <div className="-rotate-1 rounded-xl border-4 border-adventure-900 bg-parchment px-5 py-2 shadow-lg sm:px-8 sm:py-3">
            <h1 className="font-display whitespace-nowrap text-xl font-extrabold text-adventure-800 sm:text-3xl">
              MathAdventura<span className="align-super text-xs sm:text-sm">™</span>
            </h1>
          </div>
        </div>

        <div className="absolute right-3 top-3 z-10 hidden items-center gap-2 rounded-full border-2 border-adventure-900 bg-white/85 py-1 pl-1 pr-3 shadow sm:right-5 sm:top-5 sm:flex">
          <span className="font-display flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold-400 bg-adventure-800 text-sm font-extrabold text-white sm:h-9 sm:w-9">
            {initial}
          </span>
          <span className="font-display text-xs font-extrabold text-adventure-800 sm:text-sm">
            Lv {displayLevel} · {displayXp} XP
          </span>
        </div>

        <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-4 sm:left-10 sm:gap-6">
          {visibleMenuItems.map((item) => (
            <MenuButton
              key={item.key}
              onClick={() => handleMenuClick(item)}
              disabled={item.key === 'quit' && logoutMutation.isPending}
            >
              {item.label}
            </MenuButton>
          ))}
        </div>

        <div className="absolute bottom-4 right-4 z-10 flex gap-2.5 sm:bottom-6 sm:right-6 sm:gap-4">
          <HudButton icon="ℹ️" label="About" onClick={() => handleHudClick(() => setShowAbout(true))} />
          <HudButton
            icon="📜"
            label="Recent Activity"
            onClick={() => handleHudClick(() => setShowActivity(true))}
          />
          <HudButton
            icon="🎖️"
            label="Achievement"
            onClick={() => handleHudClick(() => setShowAchievements(true))}
          />
        </div>
      </div>

      {showLoginPrompt && (
        <DashboardDialog title="Login Required" onClose={() => setShowLoginPrompt(false)}>
          <p className="mt-2 text-sm text-adventure-600">
            Log in or create an account to start your quest and track your progress!
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="font-display rounded-2xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-adventure-900 shadow-md shadow-gold-700/20 transition-transform hover:bg-gold-500 active:scale-95"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="font-display rounded-2xl bg-adventure-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-adventure-900/20 transition-transform hover:bg-adventure-600 active:scale-95"
            >
              Create Account
            </button>
          </div>
        </DashboardDialog>
      )}

      {showActivity && (
        <DashboardDialog title="Recent Activity" onClose={() => setShowActivity(false)}>
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
        </DashboardDialog>
      )}

      {showLeaderboard && (
        <DashboardDialog title="Global Leaderboard" onClose={() => setShowLeaderboard(false)} widthClass="max-w-md">
          {leaderboardQuery.isLoading && <p className="mt-2 text-sm text-adventure-600">Loading...</p>}
          {leaderboardQuery.data?.length === 0 && (
            <p className="mt-2 text-sm text-adventure-600">No adventurers yet!</p>
          )}
          <ol className="mt-3 space-y-2">
            {leaderboardQuery.data?.map((entry) => (
              <li
                key={entry.student_id}
                className="flex items-center justify-between rounded-xl bg-adventure-50 px-4 py-2 text-sm"
              >
                <span className="font-display font-semibold text-adventure-800">
                  #{entry.rank} {entry.name}
                </span>
                <span className="text-adventure-600">
                  {entry.xp} XP · Lv {entry.level}
                </span>
              </li>
            ))}
          </ol>
        </DashboardDialog>
      )}

      {showAbout && (
        <DashboardDialog title="About" onClose={() => setShowAbout(false)}>
          <div className="mt-3 text-center">
            <h3 className="font-display text-2xl font-extrabold text-adventure-700">MathAdventura</h3>
            <p className="mt-3 text-adventure-800">
              Explore a fantasy world, battle tricky math challenges, and level up your skills!
            </p>
          </div>
        </DashboardDialog>
      )}

      {showAchievements && (
        <DashboardDialog
          title="Achievements & Badges"
          onClose={() => setShowAchievements(false)}
          widthClass="max-w-md"
        >
          <div className="mt-3">
            <h3 className="font-display text-sm font-bold text-adventure-700">Achievements</h3>
            {achievementsQuery.isLoading && <p className="mt-2 text-sm text-adventure-600">Loading...</p>}
            <ul className="mt-2 space-y-2">
              {achievementsQuery.data?.achievements.map((achievement) => (
                <li
                  key={achievement.id}
                  className={cx(
                    'rounded-xl px-4 py-2 text-sm',
                    achievement.earned ? 'bg-gold-100' : 'bg-adventure-50 opacity-60',
                  )}
                >
                  <p className="font-display font-semibold text-adventure-800">{achievement.name}</p>
                  <p className="text-xs text-adventure-600">{achievement.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <h3 className="font-display text-sm font-bold text-adventure-700">Badges</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {achievementsQuery.data?.badges.map((badge) => (
                <li
                  key={badge.id}
                  className={cx(
                    'rounded-xl px-4 py-2 text-center text-sm',
                    badge.earned ? 'bg-magic-100' : 'bg-adventure-50 opacity-60',
                  )}
                >
                  <p className="font-display font-semibold text-adventure-800">{badge.name}</p>
                  <p className="text-xs text-adventure-600">{badge.rarity}</p>
                </li>
              ))}
            </ul>
          </div>
        </DashboardDialog>
      )}
    </div>
  )
}
