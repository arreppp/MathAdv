import type { MouseEvent, PropsWithChildren } from 'react'

interface ModalProps extends PropsWithChildren {
  open: boolean
  onClose?: () => void
}

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null

  const stopPropagation = (event: MouseEvent) => event.stopPropagation()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-adventure-900/40 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={stopPropagation}>
        {children}
      </div>
    </div>
  )
}
