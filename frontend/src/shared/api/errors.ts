/**
 * Supabase auth errors (AuthError), postgrest/RPC errors (PostgrestError),
 * and our own client-side validation errors (plain Error) all expose a
 * `message` string - this just extracts it generically.
 */
export function extractApiErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return undefined
}
