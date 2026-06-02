import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Clock3 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { BookingStatusBadge } from '../../components/ui/BookingStatusBadge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import {
  cancelBooking,
  getMyBookings,
} from '../../features/bookings/bookings.api'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate, getLocalDateKey } from '../../utils/dates'

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
        <Alert variant="success">
          {successMessage}
        </Alert>
      ) : null}
      {cancellationMutation.isError ? (
        <Alert variant="error">
          {getApiErrorMessage(
            cancellationMutation.error,
            'Unable to cancel booking',
          )}
        </Alert>
      ) : null}
      {bookingsQuery.isPending ? (
        <p className="flex items-center gap-2 text-sm text-slate-500"><LoadingSpinner /> Loading your bookings...</p>
      ) : null}
      {bookingsQuery.isError ? (
        <Alert variant="error">
          {getApiErrorMessage(bookingsQuery.error, 'Unable to load bookings')}
        </Alert>
      ) : null}
      {bookingsQuery.data?.length === 0 ? (
        <EmptyState title="You do not have any service bookings yet." />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {bookingsQuery.data?.map((booking) => {
          const slot = booking.daySlot.slot
          const canCancel =
            booking.daySlot.date > getLocalDateKey() &&
            booking.status !== 'cancelled' &&
            booking.status !== 'completed'

          return (
            <Card as="article" key={booking.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900">
                    {slot.service.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{slot.label}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">
                    Bike Number:
                  </span>{' '}
                  {booking.bike_number || 'Not provided'}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">
                    Bike Model:
                  </span>{' '}
                  {booking.bike_model || 'Not provided'}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  {formatDate(booking.daySlot.date)}
                </p>
                {slot.display_time && slot.start_time && slot.end_time ? (
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
                <Button
                  className="mt-5 w-full sm:w-auto"
                  disabled={cancellationMutation.isPending}
                  onClick={() => cancellationMutation.mutate(booking.id)}
                  loading={
                    cancellationMutation.isPending &&
                    cancellationMutation.variables === booking.id
                  }
                  loadingText="Cancelling..."
                  variant="danger"
                >
                  Cancel booking
                </Button>
              ) : null}
              {booking.status === 'completed' && !booking.review ? (
                <Link
                  className="mt-5 inline-flex w-full justify-center rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
                  to={`/client/reviews/new?bookingId=${booking.id}`}
                >
                  Leave Review
                </Link>
              ) : null}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
