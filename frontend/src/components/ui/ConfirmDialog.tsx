import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmDialogProps = {
  confirmLabel: string
  description: string
  isConfirming?: boolean
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
}

export function ConfirmDialog({
  confirmLabel,
  description,
  isConfirming = false,
  isOpen,
  onClose,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" disabled={isConfirming} onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button className="w-full sm:w-auto" loading={isConfirming} loadingText="Working..." onClick={onConfirm} variant="danger">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
