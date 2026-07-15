import { Card } from '@/shared/ui/Card'

export function TeacherDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-extrabold text-adventure-700">Teacher Dashboard</h1>
        <p className="mt-2 text-adventure-700">
          Student performance analytics, completion rates, and weak/strong topic charts are coming soon.
        </p>
      </Card>
    </div>
  )
}
