import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-adventure-500 hover:bg-adventure-600 text-white shadow-md shadow-adventure-900/20',
  secondary: 'bg-gold-400 hover:bg-gold-500 text-adventure-900 shadow-md shadow-gold-700/20',
  ghost: 'bg-transparent hover:bg-adventure-100 text-adventure-700',
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        'font-display rounded-2xl px-5 py-2.5 font-semibold transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
