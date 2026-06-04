import { CheckCircle2 } from 'lucide-react'
import type { Service } from '../../types/service'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

type ServiceDetailsModalProps = {
  isOpen: boolean
  onChoose: (serviceId: string) => void
  onClose: () => void
  service: Service | null
}

export function ServiceDetailsModal({
  isOpen,
  onChoose,
  onClose,
  service,
}: ServiceDetailsModalProps) {
  if (!service) {
    return null
  }

  return (
    <Modal
      description="Review all included service checks before choosing this service."
      isOpen={isOpen}
      onClose={onClose}
      title={service.name}
      width="lg"
    >
      <div className="space-y-5">
        {service.description ? (
          <p className="text-sm leading-6 text-slate-600">
            {service.description}
          </p>
        ) : null}
        <section>
          <h3 className="text-sm font-bold text-slate-950">Service includes</h3>
          {service.details?.length ? (
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              {service.details.map((detail) => (
                <li className="flex gap-2" key={detail}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand-600"
                  />
                  <span className="min-w-0 wrap-break-word">{detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No service details added yet.
            </p>
          )}
        </section>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" onClick={onClose} variant="secondary">
            Close
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => onChoose(service.id)}
          >
            Choose This Service
          </Button>
        </div>
      </div>
    </Modal>
  )
}
