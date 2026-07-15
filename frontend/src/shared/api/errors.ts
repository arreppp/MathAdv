import axios from 'axios'

export function extractApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined

  const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined

  if (data?.errors) {
    const firstField = Object.values(data.errors)[0]
    if (firstField?.[0]) return firstField[0]
  }

  return data?.message
}
