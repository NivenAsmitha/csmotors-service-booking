import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/Button'
import { createReview } from '../../features/reviews/reviews.api'
import { getApiErrorMessage } from '../../utils/api-error'

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Select a rating').max(5),
  comment: z.string().trim().max(1000, 'Comment must be 1000 characters or less'),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

export function LeaveReviewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '' },
  })
  const mutation = useMutation({
    mutationFn: (values: ReviewFormValues) => {
      if (!bookingId) {
        throw new Error('Booking ID is required')
      }

      return createReview({
        booking_id: bookingId,
        rating: values.rating,
        ...(values.comment ? { comment: values.comment } : {}),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      navigate('/client/bookings', {
        replace: true,
        state: { successMessage: 'Thank you. Your review has been submitted.' },
      })
    },
  })

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
        Client feedback
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        Leave a Review
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Rate your completed service and share feedback with CS Motors.
      </p>
      {!bookingId ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          A booking must be selected before leaving a review.
        </p>
      ) : null}
      {mutation.isError ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(mutation.error, 'Unable to submit review')}
        </p>
      ) : null}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Rating</span>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            {...register('rating', { valueAsNumber: true })}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} star{rating === 1 ? '' : 's'}
              </option>
            ))}
          </select>
          {errors.rating ? <span className="mt-1.5 block text-xs text-red-600">{errors.rating.message}</span> : null}
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Comment (optional)</span>
          <textarea
            className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            placeholder="Tell us about your experience"
            {...register('comment')}
          />
          {errors.comment ? <span className="mt-1.5 block text-xs text-red-600">{errors.comment.message}</span> : null}
        </label>
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Link
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            to="/client/bookings"
          >
            Cancel
          </Link>
          <Button disabled={!bookingId || mutation.isPending} type="submit">
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </section>
  )
}
