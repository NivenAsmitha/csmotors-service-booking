import { BookOpen, ClipboardList, FileChartColumn, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'

const quickLinks = [
  { label: 'Audit Logs', to: '/developer/audit-logs', icon: ClipboardList },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Reports', to: '/admin/reports', icon: FileChartColumn },
  { label: 'Bookings', to: '/admin/bookings', icon: BookOpen },
]

export function DeveloperDashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Developer access
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Welcome, {user?.name ?? 'Developer'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Inspect system activity and operational records without modifying
          business data.
        </p>
      </section>
      <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">
        Developer access is read-only.
      </p>
      <section>
        <h2 className="text-lg font-bold text-slate-900">Quick links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(({ icon: Icon, label, to }) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500 hover:bg-brand-50"
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" className="size-5 text-brand-700" />
              <span className="mt-4 block font-bold text-slate-900">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
