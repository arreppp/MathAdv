import type { HTMLAttributes } from 'react'
import { cx } from './cx'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-3xl border-2 border-adventure-200 bg-white/90 p-6 shadow-lg shadow-adventure-900/5',
        className,
      )}
      {...props}
    />
  )
}
