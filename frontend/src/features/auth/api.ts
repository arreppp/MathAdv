import { apiClient } from '@/shared/api/client'
import type { User } from '@/shared/types'

interface AuthResponse {
  user: User
  token: string
}

export async function registerRequest(payload: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
  return data
}

export async function loginRequest(payload: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
  return data
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function meRequest(): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>('/auth/me')
  return data
}
