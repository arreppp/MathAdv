interface MultipleChoiceQuestionProps {
  prompt: string
  options: string[]
  onAnswer: (answer: string) => void
  disabled?: boolean
}

export function MultipleChoiceQuestion({ prompt, options, onAnswer, disabled }: MultipleChoiceQuestionProps) {
  return (
    <div>
      <p className="font-display text-lg font-bold text-adventure-800">{prompt}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(option)}
            className="rounded-2xl border-2 border-adventure-300 bg-adventure-50 px-4 py-3 font-display font-semibold text-adventure-800 transition-colors hover:bg-adventure-200 disabled:opacity-50"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
