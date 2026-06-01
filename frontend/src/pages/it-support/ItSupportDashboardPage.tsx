import { useQuery } from '@tanstack/react-query'
import { CalendarCheck2, CheckCircle2, ClipboardList, Clock3, UserCheck, UserRoundX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAssignmentBoard } from '../../features/assignments/assignments.api'
import { useAuthStore } from '../../stores/auth.store'
import { getApiErrorMessage } from '../../utils/api-error'
import { getLocalDateKey } from '../../utils/dates'

export function ItSupportDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const today = getLocalDateKey()
  const boardQuery = useQuery({
    queryKey: ['assignment-board', today],
    queryFn: () => getAssignmentBoard(today),
  })
  const bookings = boardQuery.data ?? []
  const cards = [
    { label: 'Today bookings', value: bookings.length, icon: CalendarCheck2 },
    { label: 'Assigned', value: bookings.filter((booking) => booking.assignment).length, icon: UserCheck },
    { label: 'Unassigned', value: bookings.filter((booking) => !booking.assignment).length, icon: UserRoundX },
    { label: 'In progress', value: bookings.filter((booking) => booking.status === 'in_progress').length, icon: Clock3 },
    { label: 'Completed', value: bookings.filter((booking) => booking.status === 'completed').length, icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">IT support</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Welcome, {user?.name ?? 'Support'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review today&apos;s workshop load and coordinate employee assignments.
        </p>
      </section>
      <Link
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        to="/it-support/assignments"
      >
        <ClipboardList aria-hidden="true" className="size-4" />
        Open Assignment Board
      </Link>
      {boardQuery.isPending ? <p className="text-sm text-slate-500">Loading today&apos;s summary...</p> : null}
      {boardQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(boardQuery.error, 'Unable to load assignment summary')}
        </p>
      ) : null}
      {!boardQuery.isError ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map(({ icon: Icon, label, value }) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
              <Icon aria-hidden="true" className="size-5 text-brand-700" />
              <p className="mt-4 text-3xl font-bold text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
