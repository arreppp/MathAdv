import { type FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { loginRequest } from '@/features/auth/api'
import { extractApiErrorMessage } from '@/shared/api/errors'
import { useAuthStore } from '@/shared/stores/authStore'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => {
      setUser(user)
      navigate('/dashboard')
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ name, password })
  }

  const errorMessage = extractApiErrorMessage(mutation.error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-center text-2xl font-extrabold text-adventure-700">Welcome Back</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-adventure-800">
              Username
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border-2 border-adventure-200 px-3 py-2 focus:border-adventure-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-adventure-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border-2 border-adventure-200 px-3 py-2 focus:border-adventure-500 focus:outline-none"
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-adventure-700">
          New here?{' '}
          <Link to="/register" className="font-semibold text-adventure-600 underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  )
}
