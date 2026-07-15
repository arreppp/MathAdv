import { supabase } from '@/shared/api/supabaseClient'

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
  const { data, error } = await supabase.rpc('list_levels')
  if (error) throw error
  return data as GameLevel[]
}

export async function fetchNextQuestion(levelId: number, excludeId?: number): Promise<Question> {
  const { data, error } = await supabase.rpc('next_question', {
    p_level_id: levelId,
    p_exclude: excludeId ?? null,
  })
  if (error) throw error
  if (!data) throw new Error('No questions available for this level yet.')
  return data as Question
}

export async function submitAnswer(levelId: number, questionId: number, answer: string): Promise<AnswerResult> {
  const { data, error } = await supabase.rpc('submit_answer', {
    p_level_id: levelId,
    p_question_id: questionId,
    p_answer: answer,
  })
  if (error) throw error
  return data as AnswerResult
}
