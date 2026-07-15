import { type FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { registerRequest } from '@/features/auth/api'
import { extractApiErrorMessage } from '@/shared/api/errors'
import { useAuthStore } from '@/shared/stores/authStore'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

export function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (user) => {
      setUser(user)
      navigate('/dashboard')
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ name, email, password, password_confirmation: passwordConfirmation })
  }

  const errorMessage = extractApiErrorMessage(mutation.error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="font-display text-center text-2xl font-extrabold text-adventure-700">Start Your Quest</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-adventure-800">
              Name
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
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-adventure-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
          <div>
            <label htmlFor="password_confirmation" className="mb-1 block text-sm font-semibold text-adventure-800">
              Confirm Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              required
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              className="w-full rounded-xl border-2 border-adventure-200 px-3 py-2 focus:border-adventure-500 focus:outline-none"
            />
          </div>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-adventure-700">
          Already adventuring?{' '}
          <Link to="/login" className="font-semibold text-adventure-600 underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  )
}
