import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchLevels } from '@/features/game/api'
import { QuestionOverlay } from '@/features/game/components/QuestionOverlay'
import { gameEvents } from '@/features/game/gameEvents'
import { PhaserGame } from '@/features/game/PhaserGame'
import { Card } from '@/shared/ui/Card'

export function GamePage() {
  const levelsQuery = useQuery({ queryKey: ['levels'], queryFn: fetchLevels })
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [activeQuestionLevelId, setActiveQuestionLevelId] = useState<number | null>(null)

  useEffect(() => gameEvents.on('npcInteract', ({ levelId }) => setActiveQuestionLevelId(levelId)), [])

  useEffect(() => {
    if (!levelsQuery.data || selectedLevelId !== null) return
    const firstPlayable = levelsQuery.data.find((level) => level.unlocked)
    if (firstPlayable) setSelectedLevelId(firstPlayable.id)
  }, [levelsQuery.data, selectedLevelId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-adventure-100 via-parchment to-gold-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="font-display text-sm font-semibold text-adventure-700 hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-center text-2xl font-extrabold text-adventure-700">
          World 1: Basic Arithmetic
        </h1>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {levelsQuery.data?.map((level) => (
            <button
              key={level.id}
              type="button"
              disabled={!level.unlocked}
              onClick={() => setSelectedLevelId(level.id)}
              className={`font-display rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                selectedLevelId === level.id
                  ? 'bg-adventure-500 text-white'
                  : level.unlocked
                    ? 'bg-white text-adventure-700 hover:bg-adventure-100'
                    : 'cursor-not-allowed bg-adventure-100 text-adventure-400'
              }`}
            >
              {level.progress?.status === 'completed' ? '⭐ ' : ''}
              {level.name}
            </button>
          ))}
        </div>

        <Card className="mt-6 p-2">
          {selectedLevelId ? (
            <PhaserGame key={selectedLevelId} levelId={selectedLevelId} />
          ) : (
            <p className="p-10 text-center text-adventure-700">Loading your adventure...</p>
          )}
        </Card>
      </div>

      <QuestionOverlay levelId={activeQuestionLevelId} onClose={() => setActiveQuestionLevelId(null)} />
    </div>
  )
}
