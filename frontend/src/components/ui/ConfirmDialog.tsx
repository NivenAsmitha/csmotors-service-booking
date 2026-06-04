import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmDialogProps = {
  cancelText?: string
  confirmLabel?: string
  confirmText?: string
  description?: ReactNode
  isConfirming?: boolean
  isOpen?: boolean
  loading?: boolean
  message?: ReactNode
  onCancel?: () => void
  onClose?: () => void
  onConfirm: () => void
  open?: boolean
  title: string
  variant?: 'default' | 'danger' | 'warning'
}

export function ConfirmDialog({
  cancelText = 'Cancel',
  confirmLabel,
  confirmText,
  description,
  isConfirming = false,
  isOpen,
  loading,
  message,
  onCancel,
  onClose,
  onConfirm,
  open,
  title,
  variant = 'danger',
}: ConfirmDialogProps) {
  const close = onCancel ?? onClose ?? (() => undefined)
  const isLoading = loading ?? isConfirming

  return (
    <Modal isOpen={open ?? isOpen ?? false} onClose={close} title={title}>
      <div className="text-sm leading-6 text-slate-600">{message ?? description}</div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" disabled={isLoading} onClick={close} variant="secondary">
          {cancelText}
        </Button>
        <Button className="w-full sm:w-auto" loading={isLoading} loadingText="Working..." onClick={onConfirm} variant={variant === 'default' ? 'primary' : variant}>
          {confirmText ?? confirmLabel ?? 'Confirm'}
        </Button>
      </div>
    </Modal>
  )
}
