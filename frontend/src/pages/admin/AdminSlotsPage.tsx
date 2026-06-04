import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock3, LockKeyhole, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import {
  createDayClosure,
  deleteDayClosure,
  getDayClosures,
} from '../../features/day-closures/dayClosures.api'
import {
  getServiceSlots,
  getSlotsConfig,
  updateDaySlotClosed,
} from '../../features/slots/slots.api'
import {
  getGlobalTimeMode,
  updateGlobalTimeMode,
} from '../../features/settings/settings.api'
import { useAuthStore } from '../../stores/auth.store'
import type { Slot } from '../../types/service'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate } from '../../utils/dates'

export function AdminSlotsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const isReadOnly = currentUser?.role === 'developer'
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [closureDate, setClosureDate] = useState('')
  const [closureReason, setClosureReason] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const configQuery = useQuery({
    queryKey: ['slots-config'],
    queryFn: getSlotsConfig,
  })
  const globalTimeModeQuery = useQuery({
    queryKey: ['global-time-mode'],
    queryFn: getGlobalTimeMode,
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
  const globalTimeModeMutation = useMutation({
    mutationFn: updateGlobalTimeMode,
    onSuccess: async () => {
      setSuccessMessage('Global client time display updated.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['global-time-mode'] }),
        refreshConfig(),
        refreshDatedSlots(),
      ])
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
    globalTimeModeMutation.error ??
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

    setConfirmation({ kind: 'close-day' })
  }

  function confirmAction() {
    if (!confirmation) {
      return
    }

    if (confirmation.kind === 'global-time-mode') {
      globalTimeModeMutation.mutate(confirmation.showTime)
    } else if (confirmation.kind === 'slot') {
      closedMutation.mutate({
        id: confirmation.slot.day_slot_id,
        isClosed: !confirmation.slot.is_closed,
      })
    } else if (confirmation.kind === 'close-day') {
      createClosureMutation.mutate({
        date: closureDate,
        ...(closureReason.trim() ? { reason: closureReason.trim() } : {}),
      })
    } else {
      deleteClosureMutation.mutate(confirmation.date)
    }

    setConfirmation(null)
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
          Control customer time visibility, slot availability, and full-day
          closures.
        </p>
      </section>

      {isReadOnly ? (
        <Alert className="font-semibold" variant="info">
          <LockKeyhole aria-hidden="true" className="size-4" />
          Developer read-only
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert variant="success">
          {successMessage}
        </Alert>
      ) : null}
      {mutationError ? (
        <Alert variant="error">
          {getApiErrorMessage(mutationError, 'Unable to update slot settings')}
        </Alert>
      ) : null}

      <PageSection
        description="When disabled, customers see only slot labels. Staff still see exact time."
        title="Global Time Display"
      >
        {globalTimeModeQuery.isPending ? (
          <LoadingText text="Loading global time display status..." />
        ) : null}
        {globalTimeModeQuery.isError ? (
          <ErrorText
            error={globalTimeModeQuery.error}
            fallback="Unable to load global time display status"
          />
        ) : null}
        {globalTimeModeQuery.data ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <div>
              <Badge
                variant={globalTimeModeQuery.data.show_time ? 'success' : 'warning'}
              >
                {globalTimeModeQuery.data.show_time ? 'Active' : 'Inactive'}
              </Badge>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {globalTimeModeQuery.data.show_time
                  ? 'Customers see exact time'
                  : 'Customers see slot labels only'}
              </p>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={isReadOnly || globalTimeModeMutation.isPending}
              onClick={() => setConfirmation({
                kind: 'global-time-mode',
                showTime: !globalTimeModeQuery.data.show_time,
              })}
              variant={globalTimeModeQuery.data.show_time ? 'secondary' : 'primary'}
            >
              {globalTimeModeQuery.data.show_time
                ? 'Deactivate Time Showing'
                : 'Activate Time Showing'}
            </Button>
          </div>
        ) : null}
      </PageSection>

      <PageSection
        description="Exact times remain visible here for internal scheduling. Customer visibility is controlled by the global setting above."
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
                <table className="min-w-90 divide-y divide-slate-200 text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Label</th>
                      <th className="px-4 py-3 font-semibold">Exact time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {service.timeSlots.map((slot) => (
                      <tr key={slot.id}>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{slot.label}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{slot.start_time} - {slot.end_time}</td>
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
        description="Choose a service and date to open or close individual slots. Exact times remain visible for internal scheduling."
        title="Date Slot Availability"
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
        {!serviceId || !date ? <LoadingText loading={false} text="Select a service and date to view day slots." /> : null}
        {datedSlotsQuery.isPending && serviceId && date ? <LoadingText text="Loading date slots..." /> : null}
        {datedSlotsQuery.isError ? <ErrorText error={datedSlotsQuery.error} fallback="Unable to load date slots" /> : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {datedSlotsQuery.data?.map((slot) => {
            const exactTime = exactTimesBySlotId.get(slot.slot_id)
            return (
              <article className="rounded-xl border border-slate-200 p-4" key={slot.day_slot_id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{slot.label}</h3>
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
                    <AvailabilityBadge slot={slot} />
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Booked: {slot.booked_count} / {slot.max_bookings}
                  {slot.reason ? ` | Reason: ${formatReason(slot.reason)}` : ''}
                </p>
                <div className="mt-4 flex justify-end">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={isReadOnly || closedMutation.isPending}
                    onClick={() => setConfirmation({ kind: 'slot', slot })}
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
          <Textarea
              className="min-h-12"
              disabled={isReadOnly}
              label="Reason (optional)"
              maxLength={500}
              onChange={(event) => setClosureReason(event.target.value)}
              placeholder="Shop closed for maintenance"
              value={closureReason}
          />
          <Button
            className="w-full lg:w-auto"
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
                  className="w-full sm:w-auto"
                  disabled={isReadOnly || deleteClosureMutation.isPending}
                  onClick={() => setConfirmation({ kind: 'reopen-day', date: closureDateKey })}
                  variant="secondary"
                >
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Reopen Day
                </Button>
              </article>
            )
          })}
          {closuresQuery.data?.length === 0 ? <EmptyState title="No day closures configured." /> : null}
        </div>
      </PageSection>
      <ConfirmDialog
        confirmLabel={getConfirmationCopy(confirmation).confirmLabel}
        description={getConfirmationCopy(confirmation).description}
        isConfirming={
          closedMutation.isPending ||
          globalTimeModeMutation.isPending ||
          createClosureMutation.isPending ||
          deleteClosureMutation.isPending
        }
        isOpen={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmAction}
        title={getConfirmationCopy(confirmation).title}
      />
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
    <Card padding="lg">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </Card>
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

type Confirmation =
  | { kind: 'global-time-mode'; showTime: boolean }
  | { kind: 'slot'; slot: Slot }
  | { kind: 'close-day' }
  | { kind: 'reopen-day'; date: string }

function getConfirmationCopy(confirmation: Confirmation | null) {
  if (confirmation?.kind === 'global-time-mode') {
    return {
      confirmLabel: confirmation.showTime ? 'Activate time showing' : 'Deactivate time showing',
      description: confirmation.showTime
        ? 'Show exact slot times to customers? Staff already see exact internal times.'
        : 'Hide exact slot times from customers? Customers will see only slot labels. Staff will still see exact internal times.',
      title: confirmation.showTime ? 'Activate customer time display' : 'Deactivate customer time display',
    }
  }

  if (confirmation?.kind === 'slot') {
    const action = confirmation.slot.is_closed ? 'open' : 'close'
    return {
      confirmLabel: `${action === 'open' ? 'Open' : 'Close'} slot`,
      description: `${action === 'open' ? 'Open' : 'Close'} ${confirmation.slot.label} for ${formatDate(confirmation.slot.date)}? This changes customer availability immediately.`,
      title: `${action === 'open' ? 'Open' : 'Close'} slot`,
    }
  }

  if (confirmation?.kind === 'reopen-day') {
    return {
      confirmLabel: 'Reopen day',
      description: `Reopen ${formatDate(confirmation.date)}? Customers will be able to book available slots again.`,
      title: 'Reopen day',
    }
  }

  return {
    confirmLabel: 'Close entire day',
    description: closureDescription(),
    title: 'Close entire day',
  }
}

function closureDescription() {
  return 'Close the selected day? This disables every service slot on that date and prevents customer bookings.'
}

function LoadingText({ loading = true, text }: { loading?: boolean; text: string }) {
  return <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">{loading ? <LoadingSpinner /> : null} {text}</p>
}

function ErrorText({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <Alert className="mt-4" variant="error">
      {getApiErrorMessage(error, fallback)}
    </Alert>
  )
}

function formatReason(reason: string) {
  return reason.replaceAll('_', ' ')
}
