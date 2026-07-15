import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { logoutRequest } from '@/features/auth/api'
import { useAuthStore } from '@/shared/stores/authStore'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-10">
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-extrabold text-adventure-700">Welcome back, {user?.name}!</h1>
        <p className="mt-2 text-adventure-700">Your adventure dashboard is being built.</p>
        <Link
          to="/play"
          className="font-display mt-6 inline-block rounded-2xl bg-adventure-500 px-5 py-2.5 font-semibold text-white shadow-md shadow-adventure-900/20 transition-transform hover:bg-adventure-600 active:scale-95"
        >
          Play World 1
        </Link>
        <Button
          variant="ghost"
          className="mt-3 block"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          Log Out
        </Button>
      </Card>
    </div>
  )
}
