import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileChartColumn,
  LayoutDashboard,
  MessageSquareText,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import type { UserRole } from '../../types/auth'

type NavigationItem = {
  icon: typeof LayoutDashboard
  label: string
  to: string
}

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  developer: [
    { label: 'Dashboard', to: '/developer/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Bookings', to: '/admin/bookings', icon: BookOpen },
    { label: 'Reports', to: '/admin/reports', icon: FileChartColumn },
    { label: 'Audit Logs', to: '/developer/audit-logs', icon: ClipboardList },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Slots', to: '/admin/slots', icon: CalendarClock },
    { label: 'Bookings', to: '/admin/bookings', icon: BookOpen },
    { label: 'Reviews', to: '/admin/reviews', icon: MessageSquareText },
    { label: 'Reports', to: '/admin/reports', icon: FileChartColumn },
  ],
  it_support: [
    { label: 'Dashboard', to: '/it-support/dashboard', icon: LayoutDashboard },
    { label: 'Assignment Board', to: '/it-support/assignments', icon: UserRoundCog },
  ],
  employee: [
    { label: 'Dashboard', to: '/employee/dashboard', icon: LayoutDashboard },
    { label: 'My Reviews', to: '/employee/reviews', icon: MessageSquareText },
  ],
  client: [
    { label: 'Dashboard', to: '/client/dashboard', icon: LayoutDashboard },
    { label: 'Book Service', to: '/client/book-service', icon: CalendarClock },
    { label: 'My Bookings', to: '/client/bookings', icon: BookOpen },
  ],
}

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const role = useAuthStore((state) => state.user?.role)
  const navigation = role ? navigationByRole[role] : []

  return (
    <>
      {isOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={onClose}
          type="button"
        />
      ) : null}
      <aside className={[
        'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <div className="flex items-start justify-between px-5 py-5">
          <div>
            <p className="text-lg font-bold">CS Motors</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
              {role?.replace('_', ' ') ?? 'Dashboard'}
            </p>
          </div>
          <button aria-label="Close navigation" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden" onClick={onClose} type="button">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <nav className="space-y-1 overflow-y-auto px-3 pb-4">
        {navigation.map(({ icon: Icon, ...item }) => (
          <NavLink
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white',
              ].join(' ')
            }
            key={item.to}
            onClick={onClose}
            to={item.to}
          >
            <Icon aria-hidden="true" className="size-4" />
            {item.label}
          </NavLink>
        ))}
        </nav>
      </aside>
    </>
  )
}
