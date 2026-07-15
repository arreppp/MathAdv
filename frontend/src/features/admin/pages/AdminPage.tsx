import { Card } from '@/shared/ui/Card'

export function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-extrabold text-adventure-700">Admin Panel</h1>
        <p className="mt-2 text-adventure-700">
          Managing users, worlds, questions, badges, and leaderboards is coming soon.
        </p>
      </Card>
    </div>
  )
}
