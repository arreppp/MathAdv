import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchAchievements } from '@/features/achievements/api'
import { Card } from '@/shared/ui/Card'

export function AchievementsPage() {
  const query = useQuery({ queryKey: ['achievements'], queryFn: fetchAchievements })

  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Link to="/dashboard" className="font-display text-sm font-semibold text-adventure-700 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-center text-2xl font-extrabold text-adventure-700">
          Achievements &amp; Badges
        </h1>

        <Card>
          <h2 className="font-display text-lg font-bold text-adventure-700">Achievements</h2>
          {query.isLoading && <p className="mt-2 text-sm text-adventure-600">Loading...</p>}
          <ul className="mt-2 space-y-2">
            {query.data?.achievements.map((achievement) => (
              <li
                key={achievement.id}
                className={`rounded-xl px-4 py-2 ${achievement.earned ? 'bg-gold-100' : 'bg-adventure-50 opacity-60'}`}
              >
                <p className="font-display font-semibold text-adventure-800">{achievement.name}</p>
                <p className="text-sm text-adventure-600">{achievement.description}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold text-adventure-700">Badges</h2>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {query.data?.badges.map((badge) => (
              <li
                key={badge.id}
                className={`rounded-xl px-4 py-2 text-center ${badge.earned ? 'bg-magic-100' : 'bg-adventure-50 opacity-60'}`}
              >
                <p className="font-display font-semibold text-adventure-800">{badge.name}</p>
                <p className="text-xs text-adventure-600">{badge.rarity}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
