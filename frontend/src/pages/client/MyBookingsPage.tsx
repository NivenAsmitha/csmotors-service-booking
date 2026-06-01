import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock3 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import {
  cancelBooking,
  getMyBookings,
} from '../../features/bookings/bookings.api'
import type { BookingStatus } from '../../types/booking'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate, getLocalDateKey } from '../../utils/dates'

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-violet-100 text-violet-800',
  completed: 'bg-brand-100 text-brand-900',
  cancelled: 'bg-slate-200 text-slate-700',
}

function formatStatus(status: BookingStatus) {
  return status.replace('_', ' ')
}

export function MyBookingsPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const successMessage = (
    location.state as { successMessage?: string } | null
  )?.successMessage
  const bookingsQuery = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
  })
  const cancellationMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Client bookings
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          My Bookings
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review your service appointments and cancel eligible future bookings.
        </p>
      </section>

      {successMessage ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {successMessage}
        </p>
      ) : null}
      {cancellationMutation.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(
            cancellationMutation.error,
            'Unable to cancel booking',
          )}
        </p>
      ) : null}
      {bookingsQuery.isPending ? (
        <p className="text-sm text-slate-500">Loading your bookings...</p>
      ) : null}
      {bookingsQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(bookingsQuery.error, 'Unable to load bookings')}
        </p>
      ) : null}
      {bookingsQuery.data?.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            You do not have any service bookings yet.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {bookingsQuery.data?.map((booking) => {
          const slot = booking.daySlot.slot
          const canCancel =
            booking.daySlot.date > getLocalDateKey() &&
            booking.status !== 'cancelled' &&
            booking.status !== 'completed'

          return (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={booking.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900">
                    {slot.service.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{slot.label}</p>
                </div>
                <span
                  className={[
                    'rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                    statusStyles[booking.status],
                  ].join(' ')}
                >
                  {formatStatus(booking.status)}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  {formatDate(booking.daySlot.date)}
                </p>
                {slot.start_time && slot.end_time ? (
                  <p className="flex items-center gap-2">
                    <Clock3 aria-hidden="true" className="size-4" />
                    {slot.start_time} - {slot.end_time}
                  </p>
                ) : null}
              </div>
              {booking.notes ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                  {booking.notes}
                </p>
              ) : null}
              {canCancel ? (
                <button
                  className="mt-5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={cancellationMutation.isPending}
                  onClick={() => cancellationMutation.mutate(booking.id)}
                  type="button"
                >
                  {cancellationMutation.isPending &&
                  cancellationMutation.variables === booking.id
                    ? 'Cancelling...'
                    : 'Cancel booking'}
                </button>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
