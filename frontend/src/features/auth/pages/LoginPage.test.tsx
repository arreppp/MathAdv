import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

vi.mock('@/features/auth/api', () => ({
  loginRequest: vi.fn().mockResolvedValue({
    user: {
      id: 1,
      name: 'Test Student',
      email: 'test@example.com',
      avatar: null,
      role: { id: 1, name: 'student' },
      student: { id: 1, user_id: 1, class_id: null, xp: 0, level: 1 },
      teacher: null,
    },
    token: 'fake-token',
  }),
}))

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{<MemoryRouter>{ui}</MemoryRouter>}</QueryClientProvider>)
}

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('submits entered credentials', async () => {
    const user = userEvent.setup()
    const { loginRequest } = await import('@/features/auth/api')

    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(loginRequest).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123' },
      expect.anything(),
    )
  })
})
