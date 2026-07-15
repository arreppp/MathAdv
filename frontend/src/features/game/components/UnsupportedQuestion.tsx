interface UnsupportedQuestionProps {
  type: string
}

/**
 * Matching and drag-and-drop question types exist in the schema and
 * seeder data model but don't have a playable UI yet.
 */
export function UnsupportedQuestion({ type }: UnsupportedQuestionProps) {
  const label = type === 'matching' ? 'Matching' : 'Drag & drop'

  return (
    <div className="rounded-xl border-2 border-dashed border-adventure-300 p-6 text-center text-adventure-600">
      <p className="font-display font-semibold">Coming soon!</p>
      <p className="mt-1 text-sm">{label} questions aren&apos;t playable yet.</p>
    </div>
  )
}
