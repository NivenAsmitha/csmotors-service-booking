import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
          CS Motors
        </p>
        <h1 className="mt-4 text-5xl font-bold text-slate-950">404</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you requested could not be found.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          to="/"
        >
          Return Home
        </Link>
      </section>
    </main>
  )
}
