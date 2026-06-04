import { LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'

type NavbarProps = {
  onLogoutClick: () => void
  onMenuClick: () => void
}

export function Navbar({ onLogoutClick, onMenuClick }: NavbarProps) {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Open navigation"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Service Booking
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {user?.name ?? 'CS Motors User'}
        </p>
        <p className="mt-0.5 text-xs capitalize text-slate-500">
          {user?.role.replace('_', ' ') ?? 'User'}
        </p>
        </div>
      </div>
      <button
        className="ml-3 inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        onClick={onLogoutClick}
        type="button"
      >
        <LogOut aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </header>
  )
}
