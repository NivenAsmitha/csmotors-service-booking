import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { BookingStatusBadge } from '../../components/ui/BookingStatusBadge'
import { Select } from '../../components/ui/Select'
import {
  getDailyReport,
  getEmployeeReport,
  getMonthlyReport,
  getSummaryReport,
  getWeeklyReport,
  type BookingStatusCounts,
  type DateBookingCount,
  type ServiceBookingCount,
} from '../../features/reports/reports.api'
import { getUsers } from '../../features/users/users.api'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate, getLocalDateKey } from '../../utils/dates'
import { formatSlotLabel } from '../../utils/formatSlotLabel'

type ReportTab = 'summary' | 'daily' | 'weekly' | 'monthly' | 'employee'

const tabs: { label: string; value: ReportTab }[] = [
  { label: 'Summary', value: 'summary' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Employee', value: 'employee' },
]

export function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>('summary')

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Reports
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review service-booking activity, ratings, and employee performance.
        </p>
      </section>
      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((item) => (
          <button
            className={[
              'whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              tab === item.value
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ].join(' ')}
            key={item.value}
            onClick={() => setTab(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      {tab === 'summary' ? <SummarySection /> : null}
      {tab === 'daily' ? <DailySection /> : null}
      {tab === 'weekly' ? <WeeklySection /> : null}
      {tab === 'monthly' ? <MonthlySection /> : null}
      {tab === 'employee' ? <EmployeeSection /> : null}
    </div>
  )
}

function SummarySection() {
  const query = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: getSummaryReport,
  })
  const report = query.data

  return (
    <ReportSection title="Dashboard Summary">
      <QueryState query={query} fallback="Unable to load summary" />
      {report ? (
        <MetricGrid
          metrics={[
            ['Total users', report.total_users],
            ['Total clients', report.total_clients],
            ['Total employees', report.total_employees],
            ['Total bookings', report.total_bookings],
            ['Today bookings', report.today_bookings],
            ['Pending bookings', report.pending_bookings],
            ['Completed bookings', report.completed_bookings],
            ['Cancelled bookings', report.cancelled_bookings],
            ['Average rating', formatRating(report.average_rating)],
            ['Active services', report.active_services_count],
          ]}
        />
      ) : null}
    </ReportSection>
  )
}

function DailySection() {
  const [date, setDate] = useState(getLocalDateKey())
  const query = useQuery({
    queryKey: ['reports', 'daily', date],
    queryFn: () => getDailyReport(date),
    enabled: Boolean(date),
  })
  const report = query.data

  return (
    <ReportSection title="Daily Report">
      <DateInput label="Report date" onChange={setDate} value={date} />
      <QueryState query={query} fallback="Unable to load daily report" />
      {report ? (
        <div className="mt-5 space-y-5">
          <MetricGrid
            metrics={[
              ['Total bookings', report.total_bookings],
              ['Pending', report.pending_count],
              ['Confirmed', report.confirmed_count],
              ['In progress', report.in_progress_count],
              ['Completed', report.completed_count],
              ['Cancelled', report.cancelled_count],
              ['Assignments', report.employee_assignments],
              ['Reviews', report.reviews_count],
              ['Average rating', formatRating(report.average_rating)],
            ]}
          />
          <ServiceBreakdown services={report.bookings_by_service} />
        </div>
      ) : null}
    </ReportSection>
  )
}

function WeeklySection() {
  const [start, setStart] = useState(getLocalDateKey())
  const query = useQuery({
    queryKey: ['reports', 'weekly', start],
    queryFn: () => getWeeklyReport(start),
    enabled: Boolean(start),
  })
  const report = query.data

  return (
    <ReportSection title="Weekly Report">
      <DateInput label="Start date" onChange={setStart} value={start} />
      <QueryState query={query} fallback="Unable to load weekly report" />
      {report ? (
        <div className="mt-5 space-y-5">
          <p className="text-sm font-semibold text-slate-700">
            {formatDate(report.start_date)} to {formatDate(report.end_date)}
          </p>
          <MetricGrid
            metrics={[
              ['Total bookings', report.total_bookings],
              ['Completed', report.completed_count],
              ['Cancelled', report.cancelled_count],
              ['Average rating', formatRating(report.average_rating)],
            ]}
          />
          <StatusBreakdown statuses={report.bookings_by_status} />
          <ServiceBreakdown services={report.bookings_by_service} />
          <DayBreakdown days={report.bookings_by_day} />
        </div>
      ) : null}
    </ReportSection>
  )
}

function MonthlySection() {
  const today = new Date()
  const [year, setYear] = useState(String(today.getFullYear()))
  const [month, setMonth] = useState(String(today.getMonth() + 1))
  const validYear = /^\d{4}$/.test(year)
  const query = useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: () => getMonthlyReport(Number(year), Number(month)),
    enabled: validYear && Boolean(month),
  })
  const report = query.data

  return (
    <ReportSection title="Monthly Report">
      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Year</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            maxLength={4}
            onChange={(event) => setYear(event.target.value)}
            value={year}
          />
        </label>
        <Select
          label="Month"
          onChange={(event) => setMonth(event.target.value)}
          options={Array.from({ length: 12 }, (_, index) => ({
            label: new Date(2000, index).toLocaleString('en', { month: 'long' }),
            value: String(index + 1),
          }))}
          value={month}
        />
      </div>
      {!validYear ? <p className="mt-3 text-sm text-red-700">Enter a four-digit year.</p> : null}
      <QueryState query={query} fallback="Unable to load monthly report" />
      {report ? (
        <div className="mt-5 space-y-5">
          <MetricGrid
            metrics={[
              ['Total bookings', report.total_bookings],
              ['Completed', report.completed_count],
              ['Cancelled', report.cancelled_count],
              ['Reviews', report.reviews_count],
              ['Average rating', formatRating(report.average_rating)],
            ]}
          />
          <StatusBreakdown statuses={report.bookings_by_status} />
          <ServiceBreakdown services={report.bookings_by_service} />
          <DayBreakdown days={report.bookings_by_day} />
        </div>
      ) : null}
    </ReportSection>
  )
}

function EmployeeSection() {
  const [employeeId, setEmployeeId] = useState('')
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const reportQuery = useQuery({
    queryKey: ['reports', 'employee', employeeId],
    queryFn: () => getEmployeeReport(employeeId),
    enabled: Boolean(employeeId),
  })
  const employees = useMemo(
    () => (usersQuery.data ?? []).filter((user) => user.role === 'employee'),
    [usersQuery.data],
  )
  const report = reportQuery.data

  return (
    <ReportSection title="Employee Report">
      <div className="max-w-sm">
        <Select
          label="Employee"
          onChange={(event) => setEmployeeId(event.target.value)}
          options={[
            { label: 'Select an employee', value: '' },
            ...employees.map((employee) => ({ label: employee.name, value: employee.id })),
          ]}
          value={employeeId}
        />
      </div>
      <QueryState query={usersQuery} fallback="Unable to load employees" />
      {employeeId ? <QueryState query={reportQuery} fallback="Unable to load employee report" /> : null}
      {report ? (
        <div className="mt-5 space-y-5">
          <div>
            <h3 className="font-bold text-slate-900">{report.employee_name}</h3>
            <p className="mt-1 text-sm text-slate-500">{report.employee_email}</p>
          </div>
          <MetricGrid
            metrics={[
              ['Assigned', report.assigned_count],
              ['Completed', report.completed_count],
              ['In progress', report.in_progress_count],
              ['Cancelled', report.cancelled_count],
              ['Reviews', report.reviews_count],
              ['Average rating', formatRating(report.average_rating)],
            ]}
          />
          <div>
            <h3 className="font-bold text-slate-900">Recent assignments</h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Slot</th>
                    <th className="px-4 py-3 font-semibold">Bike</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.recent_assignments.map((assignment) => (
                    <tr key={assignment.assignment_id}>
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(assignment.date)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{assignment.client.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">{assignment.service.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatSlotLabel(assignment.slot_label)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p>{assignment.bike_number || 'Not provided'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {assignment.bike_model || 'Not provided'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3"><BookingStatusBadge status={assignment.booking_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </ReportSection>
  )
}

function ReportSection({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-bold text-slate-950">{title}</h2><div className="mt-4">{children}</div></section>
}

function MetricGrid({ metrics }: { metrics: [string, number | string][] }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{metrics.map(([label, value]) => <article className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={label}><p className="text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p></article>)}</div>
}

function StatusBreakdown({ statuses }: { statuses: BookingStatusCounts }) {
  return <Breakdown title="Bookings by status">{Object.entries(statuses).map(([label, count]) => <BreakdownRow key={label} label={label.replace('_', ' ')} value={count} />)}</Breakdown>
}

function ServiceBreakdown({ services }: { services: ServiceBookingCount[] }) {
  return <Breakdown title="Bookings by service">{services.map((service) => <BreakdownRow key={service.service_id} label={service.service_name} value={service.count} />)}{services.length === 0 ? <p className="text-sm text-slate-500">No service bookings.</p> : null}</Breakdown>
}

function DayBreakdown({ days }: { days: DateBookingCount[] }) {
  return <Breakdown title="Bookings by day"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{days.map((day) => <BreakdownRow key={day.date} label={formatDate(day.date)} value={day.count} />)}</div></Breakdown>
}

function Breakdown({ children, title }: { children: ReactNode; title: string }) {
  return <div><h3 className="mb-3 font-bold text-slate-900">{title}</h3><div className="space-y-2">{children}</div></div>
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="capitalize text-slate-600">{label}</span><span className="font-bold text-slate-900">{value}</span></div>
}

function DateInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <label className="block max-w-xs"><span className="text-sm font-semibold text-slate-700">{label}</span><input className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100" onChange={(event) => onChange(event.target.value)} type="date" value={value} /></label>
}

function QueryState({ fallback, query }: { fallback: string; query: { error: unknown; isError: boolean; isPending: boolean } }) {
  if (query.isPending) {
    return <p className="mt-4 text-sm text-slate-500">Loading report...</p>
  }

  if (query.isError) {
    return <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(query.error, fallback)}</p>
  }

  return null
}

function formatRating(rating: number | null) {
  return rating === null ? 'No ratings' : rating.toFixed(2)
}
