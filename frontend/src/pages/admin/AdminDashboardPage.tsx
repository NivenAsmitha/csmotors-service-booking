import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileChartColumn,
  Star,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSummaryReport } from '../../features/reports/reports.api'
import { useAuthStore } from '../../stores/auth.store'
import { getApiErrorMessage } from '../../utils/api-error'

export function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user)
  const summaryQuery = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: getSummaryReport,
  })
  const summary = summaryQuery.data
  const cards = [
    { label: 'Total users', value: summary?.total_users, icon: Users },
    { label: 'Total clients', value: summary?.total_clients, icon: Users },
    { label: 'Total employees', value: summary?.total_employees, icon: Wrench },
    { label: 'Total bookings', value: summary?.total_bookings, icon: BookOpen },
    {
      label: 'Today bookings',
      value: summary?.today_bookings,
      icon: CalendarCheck2,
    },
    {
      label: 'Pending bookings',
      value: summary?.pending_bookings,
      icon: Clock3,
    },
    {
      label: 'Completed bookings',
      value: summary?.completed_bookings,
      icon: CheckCircle2,
    },
    {
      label: 'Cancelled bookings',
      value: summary?.cancelled_bookings,
      icon: XCircle,
    },
    {
      label: 'Average rating',
      value: summary?.average_rating ?? 'No ratings',
      icon: Star,
    },
    {
      label: 'Active services',
      value: summary?.active_services_count,
      icon: ClipboardList,
    },
  ]

  return (
    <div className="space-y-7">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Welcome, {user?.name ?? 'Admin'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review the current service-booking activity and open common workflows.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction icon={Users} label="Manage Users" to="/admin/users" />
          <QuickAction icon={CalendarClock} label="Manage Slots" to="/admin/slots" />
          <QuickAction icon={BookOpen} label="View Bookings" to="/admin/bookings" />
          <QuickAction icon={FileChartColumn} label="Reports" to="/admin/reports" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-900">System summary</h2>
        {summaryQuery.isPending ? (
          <p className="mt-4 text-sm text-slate-500">Loading dashboard summary...</p>
        ) : null}
        {summaryQuery.isError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getApiErrorMessage(summaryQuery.error, 'Unable to load dashboard summary')}
          </p>
        ) : null}
        {summary ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map(({ icon: Icon, label, value }) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                key={label}
              >
                <Icon aria-hidden="true" className="size-5 text-brand-700" />
                <p className="mt-4 text-2xl font-bold text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

type QuickActionProps = {
  icon: typeof Users
  label: string
  to: string
}

function QuickAction({ icon: Icon, label, to }: QuickActionProps) {
  return (
    <Link
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-500 hover:bg-brand-50"
      to={to}
    >
      <Icon aria-hidden="true" className="size-5 text-brand-700" />
      {label}
    </Link>
  )
}
