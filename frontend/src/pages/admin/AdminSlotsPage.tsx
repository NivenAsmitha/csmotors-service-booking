import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock3, LockKeyhole, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import {
  createDayClosure,
  deleteDayClosure,
  getDayClosures,
} from '../../features/day-closures/dayClosures.api'
import {
  getServiceSlots,
  getSlotsConfig,
  updateDaySlotClosed,
  updateDaySlotTimeMode,
  updateSlotTimeMode,
} from '../../features/slots/slots.api'
import { useAuthStore } from '../../stores/auth.store'
import type { Slot } from '../../types/service'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate } from '../../utils/dates'

type OverrideValue = 'inherit' | 'active' | 'inactive'

export function AdminSlotsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const isReadOnly = currentUser?.role === 'developer'
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [closureDate, setClosureDate] = useState('')
  const [closureReason, setClosureReason] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const configQuery = useQuery({
    queryKey: ['slots-config'],
    queryFn: getSlotsConfig,
  })
  const datedSlotsQuery = useQuery({
    queryKey: ['service-slots', serviceId, date],
    queryFn: () => getServiceSlots(serviceId, date),
    enabled: Boolean(serviceId && date),
  })
  const closuresQuery = useQuery({
    queryKey: ['day-closures'],
    queryFn: getDayClosures,
  })
  const exactTimesBySlotId = useMemo(
    () =>
      new Map(
        (configQuery.data ?? []).flatMap((service) =>
          service.timeSlots.map((slot) => [
            slot.id,
            { start_time: slot.start_time, end_time: slot.end_time },
          ]),
        ),
      ),
    [configQuery.data],
  )
  const services = configQuery.data ?? []
  const refreshConfig = () =>
    queryClient.invalidateQueries({ queryKey: ['slots-config'] })
  const refreshDatedSlots = () =>
    queryClient.invalidateQueries({ queryKey: ['service-slots', serviceId, date] })
  const refreshClosures = () =>
    queryClient.invalidateQueries({ queryKey: ['day-closures'] })
  const defaultModeMutation = useMutation({
    mutationFn: ({ id, showTime }: { id: string; showTime: boolean }) =>
      updateSlotTimeMode(id, showTime),
    onSuccess: async () => {
      setSuccessMessage('Default slot time mode updated.')
      await Promise.all([refreshConfig(), refreshDatedSlots()])
    },
  })
  const overrideMutation = useMutation({
    mutationFn: ({
      id,
      override,
    }: {
      id: string
      override: boolean | null
    }) => updateDaySlotTimeMode(id, override),
    onSuccess: async () => {
      setSuccessMessage('Date slot override updated.')
      await refreshDatedSlots()
    },
  })
  const closedMutation = useMutation({
    mutationFn: ({ id, isClosed }: { id: string; isClosed: boolean }) =>
      updateDaySlotClosed(id, isClosed),
    onSuccess: async () => {
      setSuccessMessage('Date slot availability updated.')
      await refreshDatedSlots()
    },
  })
  const createClosureMutation = useMutation({
    mutationFn: createDayClosure,
    onSuccess: async () => {
      setSuccessMessage('Entire day closed successfully.')
      setClosureDate('')
      setClosureReason('')
      await Promise.all([refreshClosures(), refreshDatedSlots()])
    },
  })
  const deleteClosureMutation = useMutation({
    mutationFn: deleteDayClosure,
    onSuccess: async () => {
      setSuccessMessage('Day reopened successfully.')
      await Promise.all([refreshClosures(), refreshDatedSlots()])
    },
  })
  const mutationError =
    defaultModeMutation.error ??
    overrideMutation.error ??
    closedMutation.error ??
    createClosureMutation.error ??
    deleteClosureMutation.error

  function selectService(value: string) {
    setServiceId(value)
  }

  function selectDate(value: string) {
    setDate(value)
  }

  function submitClosure() {
    if (!closureDate || isReadOnly) {
      return
    }

    createClosureMutation.mutate({
      date: closureDate,
      ...(closureReason.trim() ? { reason: closureReason.trim() } : {}),
    })
  }

  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Slot Management
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Control default time visibility, date-specific slot behavior, and
          full-day closures.
        </p>
      </section>

      {isReadOnly ? (
        <p className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
          <LockKeyhole aria-hidden="true" className="size-4" />
          Developer read-only
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {successMessage}
        </p>
      ) : null}
      {mutationError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(mutationError, 'Unable to update slot settings')}
        </p>
      ) : null}

      <PageSection
        description="These settings control the default visibility of exact times for each service slot."
        title="Default Slot Configuration"
      >
        {configQuery.isPending ? <LoadingText text="Loading slot configuration..." /> : null}
        {configQuery.isError ? <ErrorText error={configQuery.error} fallback="Unable to load slot configuration" /> : null}
        <div className="space-y-4">
          {services.map((service) => (
            <article className="overflow-hidden rounded-xl border border-slate-200" key={service.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                <h3 className="font-bold text-slate-900">{service.name}</h3>
                <span className="text-xs font-semibold text-slate-500">
                  Capacity: {service.max_bookings_per_slot} per slot
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Label</th>
                      <th className="px-4 py-3 font-semibold">Exact time</th>
                      <th className="px-4 py-3 font-semibold">Time mode</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {service.timeSlots.map((slot) => (
                      <tr key={slot.id}>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{slot.label}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{slot.start_time} - {slot.end_time}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge variant={slot.show_time ? 'success' : 'warning'}>
                            {slot.show_time ? 'Active Time' : 'Hidden Time'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Button
                            className="px-3 py-2"
                            disabled={isReadOnly || defaultModeMutation.isPending}
                            onClick={() => defaultModeMutation.mutate({ id: slot.id, showTime: !slot.show_time })}
                            variant="secondary"
                          >
                            {slot.show_time ? 'Set Inactive' : 'Set Active'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        description="Choose a service and date to override visibility or open and close individual slots."
        title="Date Slot Override"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Service"
            onChange={(event) => selectService(event.target.value)}
            options={[
              { label: 'Select a service', value: '' },
              ...services.map((service) => ({ label: service.name, value: service.id })),
            ]}
            value={serviceId}
          />
          <DateInput label="Date" onChange={selectDate} value={date} />
        </div>
        {!serviceId || !date ? <LoadingText text="Select a service and date to view day slots." /> : null}
        {datedSlotsQuery.isPending && serviceId && date ? <LoadingText text="Loading date slots..." /> : null}
        {datedSlotsQuery.isError ? <ErrorText error={datedSlotsQuery.error} fallback="Unable to load date slots" /> : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {datedSlotsQuery.data?.map((slot) => {
            const exactTime = exactTimesBySlotId.get(slot.slot_id)
            return (
              <article className="rounded-xl border border-slate-200 p-4" key={slot.day_slot_id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{slot.display_label}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {exactTime ? `${exactTime.start_time} - ${exactTime.end_time}` : 'Exact time unavailable'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(slot.date)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={slot.display_time ? 'success' : 'warning'}>
                      {slot.display_time ? 'Active Time' : 'Hidden Time'}
                    </Badge>
                    <OverrideBadge value={slot.show_time_override} />
                    <AvailabilityBadge slot={slot} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Booked: {slot.booked_count} / {slot.max_bookings}
                  {slot.reason ? ` | Reason: ${formatReason(slot.reason)}` : ''}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Select
                    disabled={isReadOnly || overrideMutation.isPending}
                    label="Time override"
                    onChange={(event) =>
                      overrideMutation.mutate({
                        id: slot.day_slot_id,
                        override: toOverrideValue(event.target.value as OverrideValue),
                      })
                    }
                    options={[
                      { label: 'Inherit', value: 'inherit' },
                      { label: 'Force Active', value: 'active' },
                      { label: 'Force Inactive', value: 'inactive' },
                    ]}
                    value={fromOverrideValue(slot.show_time_override)}
                  />
                  <Button
                    disabled={isReadOnly || closedMutation.isPending}
                    onClick={() => closedMutation.mutate({ id: slot.day_slot_id, isClosed: !slot.is_closed })}
                    variant={slot.is_closed ? 'secondary' : 'danger'}
                  >
                    {slot.is_closed ? 'Open Slot' : 'Close Slot'}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </PageSection>

      <PageSection
        description="A day closure disables all service slots for the selected date."
        title="Day Closure Manager"
      >
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
          <DateInput label="Closure date" onChange={setClosureDate} value={closureDate} />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Reason (optional)</span>
            <textarea
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              disabled={isReadOnly}
              maxLength={500}
              onChange={(event) => setClosureReason(event.target.value)}
              placeholder="Shop closed for maintenance"
              value={closureReason}
            />
          </label>
          <Button
            disabled={isReadOnly || !closureDate || createClosureMutation.isPending}
            onClick={submitClosure}
            variant="danger"
          >
            Close Entire Day
          </Button>
        </div>
        <h3 className="mt-6 font-bold text-slate-900">Existing closures</h3>
        {closuresQuery.isPending ? <LoadingText text="Loading day closures..." /> : null}
        {closuresQuery.isError ? <ErrorText error={closuresQuery.error} fallback="Unable to load day closures" /> : null}
        <div className="mt-3 space-y-2">
          {closuresQuery.data?.map((closure) => {
            const closureDateKey = closure.date.slice(0, 10)
            return (
              <article className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" key={closure.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{formatDate(closureDateKey)}</span>
                    <Badge variant="danger">Closed</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{closure.reason || 'No reason provided'}</p>
                </div>
                <Button
                  disabled={isReadOnly || deleteClosureMutation.isPending}
                  onClick={() => deleteClosureMutation.mutate(closureDateKey)}
                  variant="secondary"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Reopen Day
                </Button>
              </article>
            )
          })}
          {closuresQuery.data?.length === 0 ? <LoadingText text="No day closures configured." /> : null}
        </div>
      </PageSection>
    </div>
  )
}

type PageSectionProps = {
  children: React.ReactNode
  description: string
  title: string
}

function PageSection({ children, description, title }: PageSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

type DateInputProps = {
  label: string
  onChange: (value: string) => void
  value: string
}

function DateInput({ label, onChange, value }: DateInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative mt-2 block">
        <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={value}
        />
      </span>
    </label>
  )
}

function AvailabilityBadge({ slot }: { slot: Slot }) {
  if (slot.reason === 'day_closed' || slot.is_closed) {
    return <Badge variant="danger">Closed</Badge>
  }

  if (!slot.available) {
    return <Badge variant="warning">Full</Badge>
  }

  return <Badge variant="success">Available</Badge>
}

function OverrideBadge({ value }: { value?: boolean | null }) {
  if (value === true) {
    return <Badge variant="info">Force Active</Badge>
  }

  if (value === false) {
    return <Badge variant="warning">Force Inactive</Badge>
  }

  return <Badge>Inherit</Badge>
}

function LoadingText({ text }: { text: string }) {
  return <p className="mt-4 text-sm text-slate-500">{text}</p>
}

function ErrorText({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {getApiErrorMessage(error, fallback)}
    </p>
  )
}

function fromOverrideValue(value?: boolean | null): OverrideValue {
  if (value === true) {
    return 'active'
  }

  if (value === false) {
    return 'inactive'
  }

  return 'inherit'
}

function toOverrideValue(value: OverrideValue) {
  if (value === 'active') {
    return true
  }

  if (value === 'inactive') {
    return false
  }

  return null
}

function formatReason(reason: string) {
  return reason.replaceAll('_', ' ')
}
