import { useQuery } from '@tanstack/react-query'
import { MessageSquareText, Star } from 'lucide-react'
import { RatingStars } from '../../components/ui/RatingStars'
import { getMyReviews } from '../../features/reviews/reviews.api'
import { getApiErrorMessage } from '../../utils/api-error'
import { formatDate } from '../../utils/dates'

export function EmployeeReviewsPage() {
  const reviewsQuery = useQuery({
    queryKey: ['my-reviews'],
    queryFn: getMyReviews,
  })
  const reviews = reviewsQuery.data ?? []
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : null

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Employee feedback</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My Reviews</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">View customer feedback for your completed work.</p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <SummaryCard icon={<Star aria-hidden="true" className="size-5" />} label="Average rating" value={averageRating === null ? 'No ratings' : averageRating.toFixed(2)} />
        <SummaryCard icon={<MessageSquareText aria-hidden="true" className="size-5" />} label="Total reviews" value={reviews.length} />
      </section>
      {reviewsQuery.isPending ? <p className="text-sm text-slate-500">Loading reviews...</p> : null}
      {reviewsQuery.isError ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(reviewsQuery.error, 'Unable to load reviews')}</p> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {reviews.map((review) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={review.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <RatingStars rating={review.rating} showValue />
              <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{review.comment || 'No written comment.'}</p>
            <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p><span className="font-semibold text-slate-700">Client:</span> {review.client?.name || 'Unknown'}</p>
              <p className="mt-1"><span className="font-semibold text-slate-700">Service:</span> {review.booking?.service.name || 'Unknown'}</p>
              <p className="mt-1"><span className="font-semibold text-slate-700">Booking date:</span> {review.booking?.date ? formatDate(review.booking.date) : 'Unknown'}</p>
            </div>
          </article>
        ))}
      </div>
      {reviewsQuery.data?.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No customer reviews yet.</p> : null}
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-brand-700">{icon}</span><p className="mt-4 text-3xl font-bold text-slate-950">{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></article>
}
