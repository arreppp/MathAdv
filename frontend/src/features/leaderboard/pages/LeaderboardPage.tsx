import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchLeaderboard } from '@/features/leaderboard/api'
import { Card } from '@/shared/ui/Card'

export function LeaderboardPage() {
  const query = useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard })

  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/dashboard" className="font-display text-sm font-semibold text-adventure-700 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display mt-2 text-center text-2xl font-extrabold text-adventure-700">
          Global Leaderboard
        </h1>
        <Card className="mt-6">
          {query.isLoading && <p className="text-center text-adventure-600">Loading...</p>}
          <ol className="space-y-2">
            {query.data?.map((entry) => (
              <li
                key={entry.student_id}
                className="flex items-center justify-between rounded-xl bg-adventure-50 px-4 py-2"
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
          {query.data?.length === 0 && <p className="text-center text-adventure-600">No adventurers yet!</p>}
        </Card>
      </div>
    </div>
  )
}
