import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBooking } from '../../features/bookings/bookings.api'
import {
  getServices,
  getServiceSlots,
} from '../../features/services/services.api'
import type { Slot } from '../../types/service'
import { getApiErrorMessage } from '../../utils/api-error'
import { getLocalDateKey } from '../../utils/dates'

function getUnavailableLabel(slot: Slot) {
  if (slot.reason === 'day_closed') {
    return 'Day closed'
  }

  if (slot.is_closed) {
    return 'Slot closed'
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
  const [notes, setNotes] = useState('')
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

  function selectDate(value: string) {
    setDate(value)
    setSelectedDaySlotId('')
  }

  function submitBooking() {
    if (!selectedDaySlotId) {
      return
    }

    bookingMutation.mutate({
      day_slot_id: selectedDaySlotId,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    })
  }

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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">1. Choose a service</h2>
        {servicesQuery.isPending ? (
          <p className="mt-4 text-sm text-slate-500">Loading services...</p>
        ) : null}
        {servicesQuery.isError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(servicesQuery.error, 'Unable to load services')}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {servicesQuery.data?.map((service) => (
            <button
              className={[
                'rounded-xl border p-4 text-left transition',
                serviceId === service.id
                  ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100'
                  : 'border-slate-200 hover:border-brand-500 hover:bg-slate-50',
              ].join(' ')}
              key={service.id}
              onClick={() => selectService(service.id)}
              type="button"
            >
              <span className="block font-semibold text-slate-900">
                {service.name}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {service.duration_minutes} minutes
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">3. Pick a slot</h2>
        {!serviceId || !date ? (
          <p className="mt-4 text-sm text-slate-500">
            Choose a service and date to view available slots.
          </p>
        ) : null}
        {slotsQuery.isPending && serviceId && date ? (
          <p className="mt-4 text-sm text-slate-500">Loading slots...</p>
        ) : null}
        {slotsQuery.isError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(slotsQuery.error, 'Unable to load slots')}
          </p>
        ) : null}
        {slotsQuery.data?.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No slots are configured for this service.
          </p>
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
              <span className="block font-semibold">{slot.display_label}</span>
              {slot.display_time && slot.start_time && slot.end_time ? (
                <span className="mt-2 flex items-center gap-1.5 text-xs">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {slot.start_time} - {slot.end_time}
                </span>
              ) : null}
              <span className="mt-2 block text-xs">
                {slot.available
                  ? `${slot.max_bookings - slot.booked_count} place(s) available`
                  : getUnavailableLabel(slot)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">4. Add notes</h2>
        <textarea
          className="mt-4 min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional details about your vehicle or service request"
          value={notes}
        />
        {bookingMutation.isError ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(
              bookingMutation.error,
              'Unable to create booking',
            )}
          </p>
        ) : null}
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!selectedDaySlotId || bookingMutation.isPending}
          onClick={submitBooking}
          type="button"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {bookingMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </section>
    </div>
  )
}
