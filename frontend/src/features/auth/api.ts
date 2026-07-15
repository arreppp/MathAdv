import { supabase } from '@/shared/api/supabaseClient'
import type { User } from '@/shared/types'

export async function fetchMe(): Promise<User> {
  const { data, error } = await supabase.rpc('me')
  if (error) throw error
  return data as User
}

/**
 * Public registration always creates a student account - the on_auth_user_created
 * trigger (supabase/migrations) provisions the matching public.users/students
 * rows. Teacher/admin accounts are provisioned separately, same as before.
 */
export async function registerRequest(payload: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<User> {
  if (payload.password !== payload.password_confirmation) {
    throw new Error('Passwords do not match.')
  }

  const { error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: { data: { name: payload.name } },
  })
  if (error) throw error

  return fetchMe()
}

export async function loginRequest(payload: { email: string; password: string }): Promise<User> {
  const { error } = await supabase.auth.signInWithPassword(payload)
  if (error) throw error

  return fetchMe()
}

export async function logoutRequest(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
