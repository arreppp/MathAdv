import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * Keeps already-authenticated users off the landing/login/register screens.
 * Supabase persists the session in localStorage and AuthBootstrap restores
 * it on load, so a returning user with a valid session should land straight
 * on their dashboard instead of being shown a login form again.
 */
export function GuestRoute({ children }: PropsWithChildren) {
  const user = useAuthStore((state) => state.user)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
