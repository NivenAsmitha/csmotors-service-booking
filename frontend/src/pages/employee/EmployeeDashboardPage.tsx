import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock3 } from 'lucide-react'
import { useState } from 'react'
import { BookingStatusBadge } from '../../components/ui/BookingStatusBadge'
import { updateBookingStatus } from '../../features/bookings/bookings.api'
import { getMyAssignments } from '../../features/assignments/assignments.api'
import { useAuthStore } from '../../stores/auth.store'
import type { BookingStatus } from '../../types/booking'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate } from '../../utils/dates'

const employeeStatuses: { label: string; value: BookingStatus }[] = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

export function EmployeeDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [date, setDate] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const assignmentsQuery = useQuery({
    queryKey: ['my-assignments', date],
    queryFn: () => getMyAssignments(date || undefined),
  })
  const statusMutation = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string
      status: BookingStatus
    }) => updateBookingStatus(bookingId, status),
    onSuccess: async () => {
      setSuccessMessage('Booking status updated.')
      await queryClient.invalidateQueries({ queryKey: ['my-assignments'] })
    },
  })

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Employee work queue
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Welcome, {user?.name ?? 'Employee'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review assigned service jobs and update workshop progress.
        </p>
      </section>

      {successMessage ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {successMessage}
        </p>
      ) : null}
      {statusMutation.isError ? (
        <ErrorText error={statusMutation.error} fallback="Unable to update booking status" />
      ) : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block max-w-xs">
          <span className="text-sm font-semibold text-slate-700">Filter by date (optional)</span>
          <span className="relative mt-2 block">
            <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </span>
        </label>
      </section>
      {assignmentsQuery.isPending ? <p className="text-sm text-slate-500">Loading assigned jobs...</p> : null}
      {assignmentsQuery.isError ? (
        <ErrorText error={assignmentsQuery.error} fallback="Unable to load assigned jobs" />
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {assignmentsQuery.data?.map((assignment) => {
          const booking = assignment.booking
          const slot = booking.daySlot.slot
          return (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={assignment.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{slot.service.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{slot.label}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p><span className="font-semibold text-slate-800">Client:</span> {booking.client.name}</p>
                <p><span className="font-semibold text-slate-800">Contact:</span> {booking.client.phone || booking.client.email}</p>
                <p><span className="font-semibold text-slate-800">Date:</span> {formatDate(booking.daySlot.date)}</p>
                <p className="flex items-center gap-1.5"><Clock3 aria-hidden="true" className="size-4" /> {slot.start_time} - {slot.end_time}</p>
                <p><span className="font-semibold text-slate-800">Vehicle:</span> {assignment.vehicle_ref || 'Not provided'}</p>
                <p><span className="font-semibold text-slate-800">Scheduled:</span> {assignment.scheduled_time || 'Not set'}</p>
              </div>
              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Update status</span>
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  disabled={statusMutation.isPending || booking.status === 'cancelled'}
                  onChange={(event) =>
                    statusMutation.mutate({
                      bookingId: booking.id,
                      status: event.target.value as BookingStatus,
                    })
                  }
                  value={booking.status}
                >
                  {!employeeStatuses.some((option) => option.value === booking.status) ? (
                    <option disabled value={booking.status}>
                      {booking.status.replace('_', ' ')}
                    </option>
                  ) : null}
                  {employeeStatuses.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </article>
          )
        })}
      </div>
      {assignmentsQuery.data?.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No assigned jobs found.
        </p>
      ) : null}
    </div>
  )
}

function ErrorText({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {getApiErrorMessage(error, fallback)}
    </p>
  )
}
