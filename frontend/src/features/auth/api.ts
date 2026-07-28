import { supabase } from '@/shared/api/supabaseClient'
import type { User } from '@/shared/types'

/**
 * Supabase Auth always needs an email under the hood, but players only ever
 * see/enter a username. This derives a stable, unique-per-username synthetic
 * email so the frontend never has to collect a real one.
 */
function usernameToEmail(username: string): string {
  const slug = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug}@users.mathadventura.app`
}

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
  password: string
  password_confirmation: string
}): Promise<User> {
  if (payload.password !== payload.password_confirmation) {
    throw new Error('Passwords do not match.')
  }

  const { error } = await supabase.auth.signUp({
    email: usernameToEmail(payload.name),
    password: payload.password,
    options: { data: { name: payload.name } },
  })
  if (error) throw error

  return fetchMe()
}

export async function loginRequest(payload: { name: string; password: string }): Promise<User> {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(payload.name),
    password: payload.password,
  })
  if (error) throw error

  return fetchMe()
}

export async function logoutRequest(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
