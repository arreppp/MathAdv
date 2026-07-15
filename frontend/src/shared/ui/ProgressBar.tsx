interface ProgressBarProps {
  value: number
  max: number
  label?: string
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))

  return (
    <div className="w-full">
      {label && <div className="font-display mb-1 text-sm text-adventure-700">{label}</div>}
      <div className="h-4 w-full overflow-hidden rounded-full bg-adventure-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
