import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-bold text-slate-900" to="/">
            CS Motors
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link className="text-slate-600 hover:text-slate-900" to="/login">
              Log in
            </Link>
            <Link
              className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
              to="/register"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
