import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type ModalProps = {
  children: ReactNode
  description?: string
  isOpen: boolean
  onClose: () => void
  title: string
  width?: 'md' | 'lg' | 'xl'
}

export function Modal({ children, description, isOpen, onClose, title, width = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-2 sm:items-center sm:px-4 sm:py-8"
      role="dialog"
    >
      <div className={[
        'max-h-[calc(100dvh-1rem)] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-full',
        width === 'xl' ? 'max-w-4xl' : width === 'lg' ? 'max-w-2xl' : 'max-w-lg',
      ].join(' ')}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            aria-label="Close modal"
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
