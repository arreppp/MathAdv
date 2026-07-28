import { Link, useNavigate } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/shared/stores/authStore'
import { Card } from '@/shared/ui/Card'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-center text-2xl font-extrabold text-adventure-700">Welcome Back</h1>
        <LoginForm
          onSuccess={(user) => {
            setUser(user)
            navigate('/dashboard')
          }}
          footer={
            <p className="text-center text-sm text-adventure-700">
              New here?{' '}
              <Link to="/register" className="font-semibold text-adventure-600 underline">
                Create an account
              </Link>
            </p>
          }
        />
      </Card>
    </div>
  )
}
