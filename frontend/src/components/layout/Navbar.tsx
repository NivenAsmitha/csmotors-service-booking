import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'

export function Navbar() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Service Booking
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">
          {user?.name ?? 'CS Motors User'}
        </p>
        <p className="mt-0.5 text-xs capitalize text-slate-500">
          {user?.role.replace('_', ' ') ?? 'User'}
        </p>
      </div>
      <button
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        onClick={handleLogout}
        type="button"
      >
        <LogOut aria-hidden="true" className="size-4" />
        Log out
      </button>
    </header>
  )
}
