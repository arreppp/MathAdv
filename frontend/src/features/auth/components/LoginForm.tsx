import { type FormEvent, type ReactNode, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { loginRequest } from '@/features/auth/api'
import { extractApiErrorMessage } from '@/shared/api/errors'
import type { User } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

interface LoginFormProps {
  onSuccess: (user: User) => void
  footer?: ReactNode
}

export function LoginForm({ onSuccess, footer }: LoginFormProps) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess,
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ name, password })
  }

  const errorMessage = extractApiErrorMessage(mutation.error)

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="login-name" className="mb-1 block text-sm font-semibold text-adventure-800">
          Username
        </label>
        <input
          id="login-name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border-2 border-adventure-200 px-3 py-2 focus:border-adventure-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-adventure-800">
          Password
        </label>
        <input
          id="login-password"
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
      {footer}
    </form>
  )
}
