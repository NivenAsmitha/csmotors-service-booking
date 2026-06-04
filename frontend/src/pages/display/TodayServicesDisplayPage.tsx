import { useQuery } from '@tanstack/react-query'
import { MonitorCheck } from 'lucide-react'
import { getTodayServicesDisplay } from '../../features/display/display.api'
import { formatDate } from '../../utils/dates'
import { formatSlotLabel } from '../../utils/formatSlotLabel'

export function TodayServicesDisplayPage() {
  const displayQuery = useQuery({
    queryKey: ['today-services-display'],
    queryFn: () => getTodayServicesDisplay(),
    refetchInterval: 5000,
  })
  const display = displayQuery.data
  const activeServices =
    display?.services.filter(
      (service) => service.status !== 'completed' && service.status !== 'cancelled',
    ) ?? []

  if (display && !display.enabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <section className="max-w-3xl text-center">
          <MonitorCheck aria-hidden="true" className="mx-auto size-16 text-amber-300" />
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">
            Today Services Display is turned off
          </h1>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-300">
            CS Motors
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            Today Services
          </h1>
          <p className="mt-3 text-lg text-slate-300">
            {display?.date ? formatDate(display.date) : 'Loading today services...'}
          </p>
        </div>
        <p className="inline-flex w-fit rounded-full border border-brand-300/40 bg-brand-300/10 px-4 py-2 text-sm font-semibold text-brand-100">
          Auto-refreshing
        </p>
      </header>

      {displayQuery.isError ? (
        <p className="mt-8 rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-4 text-red-100">
          Unable to load today services display.
        </p>
      ) : null}

      {displayQuery.isPending ? (
        <p className="mt-8 text-xl text-slate-300">Loading services...</p>
      ) : null}

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {activeServices.map((service) => {
          const theme = getServiceTheme(service.service_name)

          return (
            <article
              className={[
                'overflow-hidden rounded-3xl border-2 bg-white text-slate-950 shadow-2xl',
                theme.border,
              ].join(' ')}
              key={service.booking_id}
            >
              <div className={['px-6 py-4', theme.header].join(' ')}>
                <h2 className="text-2xl font-black uppercase tracking-wide">
                  {service.service_name}
                </h2>
              </div>

              <div className="space-y-4 p-6 text-xl">
                <DisplayRow label="Slot" value={formatSlotLabel(service.slot_label)} valueClassName={theme.accent} />
                <DisplayRow label="Bike Number" value={service.bike_number || 'Not provided'} />
                <DisplayRow label="Bike Model" value={service.bike_model || 'Not provided'} />
                <DisplayRow label="Employee" value={service.employee_name} />
              </div>
            </article>
          )
        })}
      </section>

      {activeServices.length === 0 && !displayQuery.isPending ? (
        <p className="mt-12 rounded-3xl border border-dashed border-white/20 p-12 text-center text-2xl font-semibold text-slate-300">
          No active assigned services for today
        </p>
      ) : null}
    </main>
  )
}

function DisplayRow({
  label,
  value,
  valueClassName = 'text-slate-950',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <p className="rounded-2xl bg-slate-50 px-4 py-3">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className={['font-extrabold', valueClassName].join(' ')}>
        {value}
      </span>
    </p>
  )
}

function getServiceTheme(serviceName: string) {
  const name = serviceName.toLowerCase()

  if (name.includes('free')) {
    return {
      header: 'bg-emerald-600 text-white',
      border: 'border-emerald-200',
      accent: 'text-emerald-700',
    }
  }

  if (name.includes('full')) {
    return {
      header: 'bg-blue-600 text-white',
      border: 'border-blue-200',
      accent: 'text-blue-700',
    }
  }

  if (name.includes('super')) {
    return {
      header: 'bg-purple-600 text-white',
      border: 'border-purple-200',
      accent: 'text-purple-700',
    }
  }

  return {
    header: 'bg-slate-700 text-white',
    border: 'border-slate-200',
    accent: 'text-slate-700',
  }
}
