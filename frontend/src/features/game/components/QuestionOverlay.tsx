import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type AnswerResult, type Question, fetchNextQuestion, submitAnswer } from '@/features/game/api'
import { gameEvents } from '@/features/game/gameEvents'
import { usePlayerStore } from '@/shared/stores/playerStore'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { FillInBlankQuestion } from './FillInBlankQuestion'
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion'
import { UnsupportedQuestion } from './UnsupportedQuestion'

interface QuestionOverlayProps {
  levelId: number | null
  onClose: () => void
}

export function QuestionOverlay({ levelId, onClose }: QuestionOverlayProps) {
  const setPlayerStats = usePlayerStore((state) => state.setPlayerStats)
  const [result, setResult] = useState<AnswerResult | null>(null)

  const questionQuery = useQuery({
    queryKey: ['next-question', levelId],
    queryFn: () => fetchNextQuestion(levelId as number),
    enabled: levelId !== null,
  })

  const answerMutation = useMutation({
    mutationFn: (answer: string) => submitAnswer(levelId as number, (questionQuery.data as Question).id, answer),
    onSuccess: (data) => {
      setResult(data)
      setPlayerStats(data.student)
      gameEvents.emit('answerResult', {
        correct: data.correct,
        xpAwarded: data.xp_awarded,
        levelCompleted: data.level_completed,
      })
    },
  })

  useEffect(() => {
    setResult(null)
  }, [levelId])

  if (levelId === null) return null

  return (
    <Modal open onClose={result ? onClose : undefined}>
      {questionQuery.isLoading && <p className="text-center text-adventure-700">Loading a challenge...</p>}
      {questionQuery.isError && (
        <p className="text-center text-red-600">Couldn&apos;t load a question. Try again!</p>
      )}

      {questionQuery.data && !result && (
        <QuestionBody
          question={questionQuery.data}
          disabled={answerMutation.isPending}
          onAnswer={(answer) => answerMutation.mutate(answer)}
        />
      )}

      {result && <ResultBody result={result} onContinue={onClose} />}
    </Modal>
  )
}

function QuestionBody({
  question,
  onAnswer,
  disabled,
}: {
  question: Question
  onAnswer: (answer: string) => void
  disabled: boolean
}) {
  if (question.type === 'multiple_choice' || question.type === 'true_false') {
    return (
      <MultipleChoiceQuestion
        prompt={question.prompt}
        options={question.options ?? []}
        onAnswer={onAnswer}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'fill_blank') {
    return <FillInBlankQuestion prompt={question.prompt} onAnswer={onAnswer} disabled={disabled} />
  }

  return <UnsupportedQuestion type={question.type} />
}

function ResultBody({ result, onContinue }: { result: AnswerResult; onContinue: () => void }) {
  return (
    <div className="text-center">
      <p className={`font-display text-2xl font-extrabold ${result.correct ? 'text-adventure-600' : 'text-red-600'}`}>
        {result.correct ? 'Correct!' : 'Not quite!'}
      </p>
      {!result.correct && (
        <p className="mt-2 text-adventure-700">The answer was {String(result.correct_answer)}.</p>
      )}
      {result.explanation && <p className="mt-1 text-sm text-adventure-600">{result.explanation}</p>}
      <p className="mt-3 font-display text-adventure-700">+{result.xp_awarded} XP</p>
      {result.level_completed && (
        <p className="mt-1 font-display font-bold text-magic-600">Level complete! 🎉</p>
      )}
      <Button className="mt-4" onClick={onContinue}>
        Continue
      </Button>
    </div>
  )
}
