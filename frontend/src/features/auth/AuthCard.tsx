import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthCardProps = {
  children: ReactNode
  description: string
  title: string
}

export function AuthCard({ children, description, title }: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-7">
          <Link
            className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100"
            to="/"
          >
            CS Motors
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <div className="px-5 py-6 sm:px-8 sm:py-7">{children}</div>
      </div>
    </section>
  )
}
