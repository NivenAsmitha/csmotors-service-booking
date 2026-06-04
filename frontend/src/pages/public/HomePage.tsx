import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'

export function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const bookingPath = isAuthenticated ? '/client/book-service' : '/login'

  return (
    <section className="flex min-h-[calc(100vh-11rem)] items-center py-10 sm:py-16 lg:py-20">
      <div className="max-w-3xl">
        <p className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
          CS Motors Bike Service
        </p>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Book Your Bike Service Online
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          Choose your service, select a convenient slot, and track your booking
          easily with CS Motors.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/15 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
            to={bookingPath}
          >
            Book a Service
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            to="/login"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  )
}
