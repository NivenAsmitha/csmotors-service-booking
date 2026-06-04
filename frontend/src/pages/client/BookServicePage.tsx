import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ServiceDetailsModal } from '../../components/services/ServiceDetailsModal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Textarea } from '../../components/ui/Textarea'
import { createBooking } from '../../features/bookings/bookings.api'
import {
  getServices,
  getServiceSlots,
} from '../../features/services/services.api'
import type { Service, Slot } from '../../types/service'
import { getApiErrorMessage } from '../../utils/api-error'
import { getLocalDateKey } from '../../utils/dates'
import { formatSlotLabel } from '../../utils/formatSlotLabel'

function getUnavailableLabel(slot: Slot) {
  if (slot.reason === 'day_closed') {
    return 'Day Closed'
  }

  if (slot.is_closed) {
    return 'Closed'
  }

  if (slot.booked_count >= slot.max_bookings) {
    return 'Full'
  }

  return 'Unavailable'
}

export function BookServicePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [selectedDaySlotId, setSelectedDaySlotId] = useState('')
  const [bikeNumber, setBikeNumber] = useState('')
  const [bikeModel, setBikeModel] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [detailsService, setDetailsService] = useState<Service | null>(null)
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  })
  const slotsQuery = useQuery({
    queryKey: ['service-slots', serviceId, date],
    queryFn: () => getServiceSlots(serviceId, date),
    enabled: Boolean(serviceId && date),
  })
  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onError: () => setIsConfirming(false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      navigate('/client/bookings', {
        state: { successMessage: 'Your service booking has been confirmed.' },
      })
    },
  })

  function selectService(id: string) {
    setServiceId(id)
    setSelectedDaySlotId('')
  }

  function chooseServiceFromDetails(id: string) {
    selectService(id)
    setDetailsService(null)
  }

  function selectDate(value: string) {
    setDate(value)
    setSelectedDaySlotId('')
  }

  function submitBooking() {
    if (!selectedDaySlotId || !bikeNumber.trim() || !bikeModel.trim()) {
      setFormError('Select a slot and enter both bike details.')
      return
    }

    setFormError(null)
    setIsConfirming(true)
  }

  function confirmBooking() {
    if (!selectedDaySlotId) {
      return
    }

    bookingMutation.mutate({
      day_slot_id: selectedDaySlotId,
      bike_number: bikeNumber.trim(),
      bike_model: bikeModel.trim(),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    })
  }
  const selectedService = servicesQuery.data?.find((service) => service.id === serviceId)
  const selectedSlot = slotsQuery.data?.find((slot) => slot.day_slot_id === selectedDaySlotId)

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Client booking
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Book a Service
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select a service, choose a date, and reserve an available slot.
        </p>
      </section>

      <Card padding="lg">
        <h2 className="text-lg font-bold text-slate-900">1. Choose a service</h2>
        {servicesQuery.isPending ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><LoadingSpinner /> Loading services...</p>
        ) : null}
        {servicesQuery.isError ? (
          <Alert className="mt-4" variant="error">
            {getApiErrorMessage(servicesQuery.error, 'Unable to load services')}
          </Alert>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {servicesQuery.data?.map((service) => (
            <article
              className={[
                'flex min-h-full flex-col rounded-xl border p-4 text-left transition',
                serviceId === service.id
                  ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100'
                  : 'border-slate-200 hover:border-brand-500 hover:bg-slate-50',
              ].join(' ')}
              key={service.id}
            >
              <h3 className="font-bold text-slate-900">{service.name}</h3>
              {service.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>
              ) : null}
              <div className="mt-4 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Includes
                </p>
                {service.details?.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {service.details.slice(0, 3).map((detail) => (
                      <li className="flex gap-2" key={detail}>
                        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
                        <span className="min-w-0 wrap-break-word">{detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No service details added yet.
                  </p>
                )}
              </div>
              {service.details && service.details.length > 3 ? (
                <button
                  className="mt-2 inline-flex self-start text-sm font-semibold text-brand-700 transition hover:text-brand-800 hover:underline"
                  onClick={() => setDetailsService(service)}
                  type="button"
                >
                  View all details
                </button>
              ) : null}
              <Button
                className="mt-5 w-full"
                onClick={() => selectService(service.id)}
                variant={serviceId === service.id ? 'primary' : 'secondary'}
              >
                {serviceId === service.id ? 'Selected' : 'Choose Service'}
              </Button>
            </article>
          ))}
        </div>
        {formError && !selectedDaySlotId ? (
          <p className="mt-3 text-xs font-semibold text-red-600">
            Select an available service slot.
          </p>
        ) : null}
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-bold text-slate-900">2. Select a date</h2>
        <label className="mt-4 block max-w-sm">
          <span className="text-sm font-semibold text-slate-700">
            Service date
          </span>
          <span className="relative mt-2 block">
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400"
            />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              min={getLocalDateKey()}
              onChange={(event) => selectDate(event.target.value)}
              type="date"
              value={date}
            />
          </span>
        </label>
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-bold text-slate-900">3. Pick a slot</h2>
        {!serviceId || !date ? (
          <p className="mt-4 text-sm text-slate-500">
            Choose a service and date to view available slots.
          </p>
        ) : null}
        {slotsQuery.isPending && serviceId && date ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><LoadingSpinner /> Loading slots...</p>
        ) : null}
        {slotsQuery.isError ? (
          <Alert className="mt-4" variant="error">
            {getApiErrorMessage(slotsQuery.error, 'Unable to load slots')}
          </Alert>
        ) : null}
        {slotsQuery.data?.length === 0 ? (
          <div className="mt-4"><EmptyState title="No slots are configured for this service." /></div>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {slotsQuery.data?.map((slot) => (
            <button
              className={[
                'rounded-xl border p-4 text-left transition',
                !slot.available
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                  : selectedDaySlotId === slot.day_slot_id
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-slate-200 hover:border-brand-500 hover:bg-slate-50',
              ].join(' ')}
              disabled={!slot.available}
              key={slot.day_slot_id}
              onClick={() => setSelectedDaySlotId(slot.day_slot_id)}
              type="button"
            >
              <span className="flex flex-wrap items-start justify-between gap-3">
                <span className="font-semibold">{formatSlotLabel(slot.label)}</span>
                <SlotAvailabilityBadge slot={slot} />
              </span>
              {slot.display_time && slot.start_time && slot.end_time ? (
                <span className="mt-2 flex items-center gap-1.5 text-xs">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {slot.start_time} - {slot.end_time}
                </span>
              ) : null}
              <span className="mt-3 block text-xs">
                {slot.available
                  ? `${slot.max_bookings - slot.booked_count} place(s) available`
                  : getUnavailableLabel(slot)}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-bold text-slate-900">
          4. Add bike details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
              error={formError && !bikeNumber.trim() ? 'Bike number is required.' : undefined}
              label="Bike Number"
              maxLength={30}
              onChange={(event) => setBikeNumber(event.target.value)}
              placeholder="WP ABC-1234"
              required
              value={bikeNumber}
          />
          <Input
              error={formError && !bikeModel.trim() ? 'Bike model is required.' : undefined}
              label="Bike Model"
              maxLength={80}
              onChange={(event) => setBikeModel(event.target.value)}
              placeholder="Pulsar N160, CT100, Honda Dio"
              required
              value={bikeModel}
          />
        </div>
        <Textarea
          label="Notes (optional)"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional details about your bike or service request"
          value={notes}
          wrapperClassName="mt-4"
        />
        {formError ? (
          <Alert className="mt-4" variant="error">
            {formError}
          </Alert>
        ) : null}
        {bookingMutation.isError ? (
          <Alert className="mt-4" variant="error">
            {getApiErrorMessage(
              bookingMutation.error,
              'Unable to create booking',
            )}
          </Alert>
        ) : null}
        <Button
          className="mt-4 w-full sm:w-auto"
          disabled={
            !selectedDaySlotId ||
            !bikeNumber.trim() ||
            !bikeModel.trim() ||
            bookingMutation.isPending
          }
          onClick={submitBooking}
          loading={bookingMutation.isPending}
          loadingText="Confirming..."
          size="lg"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Confirm Booking
        </Button>
      </Card>
      <ConfirmDialog
        confirmText="Create booking"
        loading={bookingMutation.isPending}
        message={
          <div className="space-y-1">
            <p>Confirm this service booking?</p>
            <p><span className="font-semibold">Service:</span> {selectedService?.name}</p>
            <p><span className="font-semibold">Date:</span> {date}</p>
            <p><span className="font-semibold">Slot:</span> {formatSlotLabel(selectedSlot?.label)}</p>
            <p><span className="font-semibold">Bike:</span> {bikeNumber.trim()} | {bikeModel.trim()}</p>
          </div>
        }
        onCancel={() => setIsConfirming(false)}
        onConfirm={confirmBooking}
        open={isConfirming}
        title="Confirm service booking"
        variant="default"
      />
      <ServiceDetailsModal
        isOpen={Boolean(detailsService)}
        onChoose={chooseServiceFromDetails}
        onClose={() => setDetailsService(null)}
        service={detailsService}
      />
    </div>
  )
}

function SlotAvailabilityBadge({ slot }: { slot: Slot }) {
  if (slot.reason === 'day_closed') {
    return <Badge variant="danger">Day Closed</Badge>
  }

  if (slot.is_closed) {
    return <Badge variant="danger">Closed</Badge>
  }

  if (!slot.available) {
    return <Badge variant="warning">Full</Badge>
  }

  return <Badge variant="success">Available</Badge>
}
