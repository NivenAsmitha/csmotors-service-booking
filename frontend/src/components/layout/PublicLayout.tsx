import { Link, Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-black tracking-tight text-slate-950" to="/">
            CS Motors
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold sm:gap-3">
            <Link
              className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              to="/login"
            >
              Log in
            </Link>
            <Link
              className="rounded-lg bg-brand-600 px-4 py-2 text-white shadow-sm transition hover:bg-brand-700"
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
