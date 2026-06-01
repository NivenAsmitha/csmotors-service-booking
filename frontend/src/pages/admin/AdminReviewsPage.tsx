import { useQuery } from '@tanstack/react-query'
import { MessageSquareText, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RatingStars } from '../../components/ui/RatingStars'
import { Select } from '../../components/ui/Select'
import { getAllReviews } from '../../features/reviews/reviews.api'
import { getUsers } from '../../features/users/users.api'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate } from '../../utils/dates'

export function AdminReviewsPage() {
  const [rating, setRating] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [search, setSearch] = useState('')
  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: getAllReviews,
  })
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const employees = (usersQuery.data ?? []).filter((user) => user.role === 'employee')
  const reviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return (reviewsQuery.data ?? []).filter((review) => {
      const searchableText = [
        review.client?.name,
        review.client?.email,
        review.employee?.name,
        review.employee?.email,
        review.comment,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (!rating || review.rating === Number(rating)) &&
        (!employeeId || review.employee_id === employeeId) &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      )
    })
  }, [employeeId, rating, reviewsQuery.data, search])
  const allReviews = reviewsQuery.data ?? []
  const averageRating = allReviews.length
    ? allReviews.reduce((total, review) => total + review.rating, 0) / allReviews.length
    : null

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Customer Reviews</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Review customer feedback across completed services.</p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          icon={<Star aria-hidden="true" className="size-5" />}
          label="Average rating"
          value={averageRating === null ? 'No ratings' : averageRating.toFixed(2)}
        />
        <SummaryCard
          icon={<MessageSquareText aria-hidden="true" className="size-5" />}
          label="Total reviews"
          value={allReviews.length}
        />
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Search</span>
          <span className="relative mt-2 block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400" />
            <input className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100" onChange={(event) => setSearch(event.target.value)} placeholder="Client, employee, or comment" value={search} />
          </span>
        </label>
        <Select label="Rating" onChange={(event) => setRating(event.target.value)} options={[{ label: 'All ratings', value: '' }, ...[5, 4, 3, 2, 1].map((value) => ({ label: `${value} stars`, value: String(value) }))]} value={rating} />
        <Select label="Employee" onChange={(event) => setEmployeeId(event.target.value)} options={[{ label: 'All employees', value: '' }, ...employees.map((employee) => ({ label: employee.name, value: employee.id }))]} value={employeeId} />
      </section>
      {reviewsQuery.isPending ? <p className="text-sm text-slate-500">Loading reviews...</p> : null}
      {reviewsQuery.isError ? <ErrorText error={reviewsQuery.error} fallback="Unable to load reviews" /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {reviews.map((review) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={review.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <RatingStars rating={review.rating} showValue />
              <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{review.comment || 'No written comment.'}</p>
            <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:grid-cols-2">
              <p><span className="font-semibold text-slate-700">Client:</span> {review.client?.name || 'Unknown'}<br />{review.client?.email}</p>
              <p><span className="font-semibold text-slate-700">Employee:</span> {review.employee?.name || 'Unknown'}<br />{review.employee?.email}</p>
              <p><span className="font-semibold text-slate-700">Service:</span> {review.booking?.service.name || 'Unknown'}</p>
              <p><span className="font-semibold text-slate-700">Booking date:</span> {review.booking?.date ? formatDate(review.booking.date) : 'Unknown'}</p>
            </div>
          </article>
        ))}
      </div>
      {reviewsQuery.data && reviews.length === 0 ? <EmptyText text="No reviews yet." /> : null}
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-brand-700">{icon}</span><p className="mt-4 text-3xl font-bold text-slate-950">{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></article>
}

function ErrorText({ error, fallback }: { error: unknown; fallback: string }) {
  return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(error, fallback)}</p>
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{text}</p>
}
