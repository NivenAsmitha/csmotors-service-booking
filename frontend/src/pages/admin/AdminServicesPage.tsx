import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'
import {
  getAdminServices,
  updateService,
} from '../../features/services/services.api'
import { useAuthStore } from '../../stores/auth.store'
import type { Service } from '../../types/service'
import { getApiErrorMessage } from '../../utils/api-error'

export function AdminServicesPage() {
  const currentUser = useAuthStore((state) => state.user)
  const isReadOnly = currentUser?.role === 'developer'
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const servicesQuery = useQuery({
    queryKey: ['admin-services'],
    queryFn: getAdminServices,
  })

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Services
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Manage the point-wise service details clients read before choosing a
          booking category.
        </p>
      </section>

      {isReadOnly ? (
        <Alert className="font-semibold" variant="info">
          Developer read-only
        </Alert>
      ) : null}
      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
      {servicesQuery.isPending ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <LoadingSpinner /> Loading services...
        </p>
      ) : null}
      {servicesQuery.isError ? (
        <Alert variant="error">
          {getApiErrorMessage(servicesQuery.error, 'Unable to load services')}
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {servicesQuery.data?.map((service) => (
          <Card as="article" className="flex min-h-full flex-col" key={service.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {service.name}
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {service.duration_minutes} minutes | Capacity{' '}
                  {service.max_bookings_per_slot}
                </p>
              </div>
              <Badge variant={service.is_active ? 'success' : 'danger'}>
                {service.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {service.description || 'No description added yet.'}
            </p>
            <div className="mt-4 flex-1">
              {service.details?.length ? (
                <ul className="space-y-2 text-sm text-slate-700">
                  {service.details.map((detail) => (
                    <li className="flex gap-2" key={detail}>
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-brand-600"
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No service details added yet" />
              )}
            </div>
            <Button
              className="mt-5 w-full sm:w-auto"
              disabled={isReadOnly}
              onClick={() => setEditTarget(service)}
              variant="secondary"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Edit Details
            </Button>
          </Card>
        ))}
      </div>
      {servicesQuery.data?.length === 0 ? (
        <EmptyState title="No services found" />
      ) : null}

      <EditServiceDetailsModal
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null)
          setSuccessMessage('Service details updated successfully.')
        }}
        service={editTarget}
      />
    </div>
  )
}

type EditServiceDetailsModalProps = {
  onClose: () => void
  onSuccess: () => void
  service: Service | null
}

function EditServiceDetailsModal({
  onClose,
  onSuccess,
  service,
}: EditServiceDetailsModalProps) {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState('')
  const [details, setDetails] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const mutation = useMutation({
    mutationFn: () => {
      if (!service) {
        throw new Error('Service is required')
      }

      return updateService(service.id, {
        description: description.trim(),
        details: details.map((detail) => detail.trim()),
      })
    },
    onError: () => setIsConfirming(false),
    onSuccess: async () => {
      setIsConfirming(false)
      onSuccess()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-services'] }),
        queryClient.invalidateQueries({ queryKey: ['services'] }),
      ])
    },
  })

  useEffect(() => {
    setDescription(service?.description ?? '')
    setDetails(service?.details?.length ? service.details : [''])
    setFormError(null)
    setIsConfirming(false)
  }, [service])

  function close() {
    if (!mutation.isPending) {
      onClose()
    }
  }

  function updateDetail(index: number, value: string) {
    setDetails((currentDetails) =>
      currentDetails.map((detail, detailIndex) =>
        detailIndex === index ? value : detail,
      ),
    )
  }

  function removeDetail(index: number) {
    setDetails((currentDetails) =>
      currentDetails.filter((_, detailIndex) => detailIndex !== index),
    )
  }

  function requestSave() {
    if (details.some((detail) => detail.trim().length === 0)) {
      setFormError('Remove empty points or enter text for every point.')
      return
    }

    setFormError(null)
    setIsConfirming(true)
  }

  return (
    <Modal
      isOpen={Boolean(service)}
      onClose={close}
      title={service ? `Edit ${service.name}` : 'Edit service details'}
      width="lg"
    >
      {mutation.isError ? (
        <Alert className="mb-4" variant="error">
          {getApiErrorMessage(mutation.error, 'Unable to update service details')}
        </Alert>
      ) : null}
      {formError ? (
        <Alert className="mb-4" variant="error">
          {formError}
        </Alert>
      ) : null}
      <div className="space-y-4">
        <Input
          disabled
          label="Service name"
          value={service?.name ?? ''}
        />
        <Textarea
          label="Description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe what this service includes"
          value={description}
        />
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Details</p>
            <Button
              onClick={() => setDetails((currentDetails) => [...currentDetails, ''])}
              size="sm"
              variant="secondary"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add Point
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {details.map((detail, index) => (
              <div className="flex gap-2" key={`${index}-${details.length}`}>
                <Input
                  label={`Point ${index + 1}`}
                  onChange={(event) => updateDetail(index, event.target.value)}
                  placeholder="Brake inspection"
                  value={detail}
                />
                <Button
                  aria-label={`Remove point ${index + 1}`}
                  className="mt-8 shrink-0"
                  disabled={details.length === 1}
                  onClick={() => removeDetail(index)}
                  variant="danger"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button disabled={mutation.isPending} onClick={close} variant="secondary">
            No, Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={requestSave}>
            Save Changes
          </Button>
        </div>
      </div>
      <ConfirmDialog
        confirmText="Yes, Update"
        loading={mutation.isPending}
        message="Are you sure you want to update these service details?"
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => mutation.mutate()}
        open={isConfirming}
        title="Update Service Details"
        variant="warning"
      />
    </Modal>
  )
}
