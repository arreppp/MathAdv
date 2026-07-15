import { type PropsWithChildren, useEffect, useState } from 'react'
import { fetchMe } from '@/features/auth/api'
import { supabase } from '@/shared/api/supabaseClient'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * Hydrates the auth store's profile from the current Supabase session (if
 * any) on load, and keeps it in sync with sign-in/out from anywhere in the
 * app. Renders nothing until the initial check resolves, so ProtectedRoute
 * doesn't flash a redirect-to-login before a persisted session is restored.
 */
export function AuthBootstrap({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    let active = true

    async function syncProfile(hasSession: boolean) {
      if (!hasSession) {
        logout()
        return
      }

      try {
        const user = await fetchMe()
        if (active) setUser(user)
      } catch {
        if (active) logout()
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      void syncProfile(!!data.session).finally(() => {
        if (active) setReady(true)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncProfile(!!session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [setUser, logout])

  if (!ready) return null

  return <>{children}</>
}
