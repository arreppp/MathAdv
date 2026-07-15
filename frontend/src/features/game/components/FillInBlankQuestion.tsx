import { type FormEvent, useState } from 'react'
import { Button } from '@/shared/ui/Button'

interface FillInBlankQuestionProps {
  prompt: string
  onAnswer: (answer: string) => void
  disabled?: boolean
}

export function FillInBlankQuestion({ prompt, onAnswer, disabled }: FillInBlankQuestionProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) return
    onAnswer(value.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="font-display text-lg font-bold text-adventure-800">{prompt}</p>
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          className="flex-1 rounded-xl border-2 border-adventure-300 px-3 py-2 focus:border-adventure-500 focus:outline-none"
        />
        <Button type="submit" disabled={disabled}>
          Submit
        </Button>
      </div>
    </form>
  )
}
