type Listener<T> = (payload: T) => void

class TypedEmitter<Events extends object> {
  private listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {}

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = (this.listeners[event] ??= new Set())
    set.add(listener)
    return () => set.delete(listener)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((listener) => listener(payload))
  }
}

export interface GameEvents {
  npcInteract: { levelId: number }
  answerResult: { correct: boolean; xpAwarded: number; levelCompleted: boolean }
}

/**
 * Bridges the imperative Phaser scenes and the declarative React tree:
 * scenes emit npcInteract when the player reaches a challenge, React
 * grades the answer via the API and emits answerResult back so the
 * scene can react (feedback text, unlocking the NPC again).
 */
export const gameEvents = new TypedEmitter<GameEvents>()
