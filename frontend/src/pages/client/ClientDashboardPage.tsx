import { useQuery } from '@tanstack/react-query'
import { CalendarCheck2, CheckCircle2, PlusCircle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMyBookings } from '../../features/bookings/bookings.api'
import { useAuthStore } from '../../stores/auth.store'
import { getApiErrorMessage } from '../../utils/api-error'
import { getLocalDateKey } from '../../utils/dates'

export function ClientDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const bookingsQuery = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
  })
  const bookings = bookingsQuery.data ?? []
  const today = getLocalDateKey()
  const upcomingCount = bookings.filter(
    (booking) =>
      booking.daySlot.date >= today &&
      booking.status !== 'completed' &&
      booking.status !== 'cancelled',
  ).length
  const completedCount = bookings.filter(
    (booking) => booking.status === 'completed',
  ).length
  const cancelledCount = bookings.filter(
    (booking) => booking.status === 'cancelled',
  ).length

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Client dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Welcome, {user?.name ?? 'Customer'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Book your next service and keep track of your appointments.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          className="rounded-2xl bg-brand-600 p-5 text-white shadow-sm transition hover:bg-brand-700"
          to="/client/book-service"
        >
          <PlusCircle aria-hidden="true" className="size-6" />
          <span className="mt-4 block font-bold">Book Service</span>
          <span className="mt-1 block text-sm text-brand-100">
            Choose a service date and an available slot.
          </span>
        </Link>
        <Link
          className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm transition hover:bg-slate-800"
          to="/client/bookings"
        >
          <CalendarCheck2 aria-hidden="true" className="size-6" />
          <span className="mt-4 block font-bold">My Bookings</span>
          <span className="mt-1 block text-sm text-slate-300">
            Review your appointments and booking history.
          </span>
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Booking summary</h2>
        {bookingsQuery.isPending ? (
          <p className="mt-4 text-sm text-slate-500">Loading summary...</p>
        ) : null}
        {bookingsQuery.isError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getApiErrorMessage(bookingsQuery.error, 'Unable to load summary')}
          </p>
        ) : null}
        {!bookingsQuery.isError ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={<CalendarCheck2 aria-hidden="true" className="size-5" />}
              label="Upcoming"
              value={upcomingCount}
            />
            <SummaryCard
              icon={<CheckCircle2 aria-hidden="true" className="size-5" />}
              label="Completed"
              value={completedCount}
            />
            <SummaryCard
              icon={<XCircle aria-hidden="true" className="size-5" />}
              label="Cancelled"
              value={cancelledCount}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}

type SummaryCardProps = {
  icon: React.ReactNode
  label: string
  value: number
}

function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="text-brand-700">{icon}</span>
      <p className="mt-4 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </article>
  )
}
