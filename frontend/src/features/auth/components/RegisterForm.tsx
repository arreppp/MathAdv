import { type FormEvent, type ReactNode, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { registerRequest } from '@/features/auth/api'
import { extractApiErrorMessage } from '@/shared/api/errors'
import type { User } from '@/shared/types'
import { Button } from '@/shared/ui/Button'

interface RegisterFormProps {
  onSuccess: (user: User) => void
  footer?: ReactNode
}

export function RegisterForm({ onSuccess, footer }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess,
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    mutation.mutate({ name, password, password_confirmation: passwordConfirmation })
  }

  const errorMessage = extractApiErrorMessage(mutation.error)

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="register-name" className="mb-1 block text-sm font-semibold text-adventure-800">
          Username
        </label>
        <input
          id="register-name"
          type="text"
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9_ ]+"
          title="Letters, numbers, spaces, and underscores only."
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border-2 border-adventure-200 px-3 py-2 focus:border-adventure-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm font-semibold text-adventure-800">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border-2 border-adventure-200 px-3 py-2 focus:border-adventure-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="register-password-confirmation" className="mb-1 block text-sm font-semibold text-adventure-800">
          Confirm Password
        </label>
        <input
          id="register-password-confirmation"
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
      {footer}
    </form>
  )
}
