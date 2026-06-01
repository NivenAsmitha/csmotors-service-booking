import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="grid items-center gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          CS Motors Service Booking
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Book vehicle services with clear, simple scheduling.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          The frontend foundation is ready for customer booking and internal
          service operations.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            to="/register"
          >
            Create account
          </Link>
          <Link
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            to="/login"
          >
            Log in
          </Link>
        </div>
      </div>
      <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
        <p className="text-sm font-semibold text-brand-100">System foundation</p>
        <p className="mt-3 text-2xl font-bold">Frontend shell configured</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Authentication, routing, layouts, API access, and role dashboards are
          prepared for feature implementation.
        </p>
      </div>
    </section>
  )
}
