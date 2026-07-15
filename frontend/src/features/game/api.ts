import { apiClient } from '@/shared/api/client'

export type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching' | 'drag_drop'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameLevel {
  id: number
  world: number
  level_number: number
  name: string
  description: string | null
  difficulty: Difficulty
  xp_reward: number
  unlock_xp_threshold: number
  category: { id: number; name: string; slug: string }
  unlocked: boolean
  progress: {
    status: 'locked' | 'unlocked' | 'in_progress' | 'completed'
    stars: number
    best_score: number
    attempts: number
    completed_at: string | null
  } | null
}

export interface Question {
  id: number
  type: QuestionType
  difficulty: Difficulty
  prompt: string
  options: string[] | null
  xp_value: number
}

export interface AnswerResult {
  correct: boolean
  correct_answer: string | string[]
  explanation: string | null
  xp_awarded: number
  level_completed: boolean
  student: { xp: number; level: number }
  session: { id: number; questions_answered: number; correct_answers: number; xp_earned: number }
  progress: { status: string; stars: number; attempts: number; best_score: number }
}

export async function fetchLevels(): Promise<GameLevel[]> {
  const { data } = await apiClient.get<{ levels: GameLevel[] }>('/levels')
  return data.levels
}

export async function fetchNextQuestion(levelId: number, excludeId?: number): Promise<Question> {
  const { data } = await apiClient.get<{ question: Question }>(`/levels/${levelId}/questions/next`, {
    params: excludeId ? { exclude: excludeId } : undefined,
  })
  return data.question
}

export async function submitAnswer(levelId: number, questionId: number, answer: string): Promise<AnswerResult> {
  const { data } = await apiClient.post<AnswerResult>(`/levels/${levelId}/answers`, {
    question_id: questionId,
    answer,
  })
  return data
}
