import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import type { UserRole } from '../../types/auth'

type NavigationItem = {
  label: string
  to: string
}

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  developer: [
    { label: 'Dashboard', to: '/developer/dashboard' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Bookings', to: '/admin/bookings' },
    { label: 'Reports', to: '/admin/reports' },
    { label: 'Audit Logs', to: '/developer/audit-logs' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Slots', to: '/admin/slots' },
    { label: 'Bookings', to: '/admin/bookings' },
    { label: 'Reviews', to: '/admin/reviews' },
    { label: 'Reports', to: '/admin/reports' },
  ],
  it_support: [
    { label: 'Dashboard', to: '/it-support/dashboard' },
    { label: 'Assignment Board', to: '/it-support/assignments' },
  ],
  employee: [
    { label: 'Dashboard', to: '/employee/dashboard' },
    { label: 'My Reviews', to: '/employee/reviews' },
  ],
  client: [
    { label: 'Dashboard', to: '/client/dashboard' },
    { label: 'Book Service', to: '/client/book-service' },
    { label: 'My Bookings', to: '/client/bookings' },
  ],
}

export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role)
  const navigation = role ? navigationByRole[role] : []

  return (
    <aside className="border-b border-slate-800 bg-slate-950 text-slate-100 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="px-5 py-5">
        <p className="text-lg font-bold">CS Motors</p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
          {role?.replace('_', ' ') ?? 'Dashboard'}
        </p>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-4 md:block md:space-y-1">
        {navigation.map((item) => (
          <NavLink
            className={({ isActive }) =>
              [
                'block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              ].join(' ')
            }
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
