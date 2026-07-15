import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'
import type { RoleName } from '@/shared/types'

interface ProtectedRouteProps extends PropsWithChildren {
  requireRole?: RoleName
}

export function ProtectedRoute({ requireRole, children }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (requireRole && user.role?.name !== requireRole) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
