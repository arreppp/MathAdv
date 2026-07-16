import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { fetchLevels } from '@/features/game/api'
import { QuestionOverlay } from '@/features/game/components/QuestionOverlay'
import { gameEvents } from '@/features/game/gameEvents'
import { PhaserGame } from '@/features/game/PhaserGame'

export function GamePage() {
  const navigate = useNavigate()
  const levelsQuery = useQuery({ queryKey: ['levels'], queryFn: fetchLevels })
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [activeQuestionLevelId, setActiveQuestionLevelId] = useState<number | null>(null)
  const hasAutoSelected = useRef(false)

  useEffect(() => gameEvents.on('npcInteract', ({ levelId }) => setActiveQuestionLevelId(levelId)), [])
  useEffect(() => gameEvents.on('exitToMenu', () => setSelectedLevelId(null)), [])
  useEffect(() => gameEvents.on('exitToDashboard', () => navigate('/dashboard')), [navigate])

  useEffect(() => {
    if (!levelsQuery.data || selectedLevelId !== null || hasAutoSelected.current) return
    const firstPlayable = levelsQuery.data.find((level) => level.unlocked)
    if (firstPlayable) {
      hasAutoSelected.current = true
      setSelectedLevelId(firstPlayable.id)
    }
  }, [levelsQuery.data, selectedLevelId])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-adventure-100 via-parchment to-gold-100">
      <div className="mx-auto w-full max-w-5xl shrink-0 px-4 pt-3">
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
      </div>

      <div className="min-h-0 w-full flex-1">
        {selectedLevelId ? (
          <PhaserGame key={selectedLevelId} levelId={selectedLevelId} />
        ) : (
          <p className="p-10 text-center text-adventure-700">
            {levelsQuery.isLoading ? 'Loading your adventure...' : 'Pick a level above to play!'}
          </p>
        )}
      </div>

      <QuestionOverlay levelId={activeQuestionLevelId} onClose={() => setActiveQuestionLevelId(null)} />
    </div>
  )
}
