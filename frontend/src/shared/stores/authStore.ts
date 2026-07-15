import { create } from 'zustand'
import type { User } from '@/shared/types'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

/**
 * Holds the app-level profile (from the `me()` RPC), not the auth session
 * itself - supabase-js persists and refreshes the actual session/JWT on its
 * own. This store is (re)hydrated by AuthBootstrap from a Supabase auth
 * state change, not read from localStorage directly.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
