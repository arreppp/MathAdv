import { Link, useNavigate } from 'react-router-dom'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { useAuthStore } from '@/shared/stores/authStore'
import { Card } from '@/shared/ui/Card'

export function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-center text-2xl font-extrabold text-adventure-700">Start Your Quest</h1>
        <RegisterForm
          onSuccess={(user) => {
            setUser(user)
            navigate('/dashboard')
          }}
          footer={
            <p className="text-center text-sm text-adventure-700">
              Already adventuring?{' '}
              <Link to="/login" className="font-semibold text-adventure-600 underline">
                Log in
              </Link>
            </p>
          }
        />
      </Card>
    </div>
  )
}
