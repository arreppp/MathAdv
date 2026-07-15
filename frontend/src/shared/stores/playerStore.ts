import { create } from 'zustand'

interface PlayerStats {
  xp: number
  level: number
}

interface PlayerState extends PlayerStats {
  setPlayerStats: (stats: PlayerStats) => void
}

/**
 * Live xp/level for optimistic UI during gameplay, updated from each
 * answer-submission response. Separate from the persisted auth snapshot
 * in authStore, which only reflects the state at login/register time.
 */
export const usePlayerStore = create<PlayerState>((set) => ({
  xp: 0,
  level: 1,
  setPlayerStats: (stats) => set(stats),
}))
