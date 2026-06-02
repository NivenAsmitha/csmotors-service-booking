import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'
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
    <Card className="mx-auto max-w-xl" padding="lg">
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
        <Alert className="mt-5" variant="error">
          A booking must be selected before leaving a review.
        </Alert>
      ) : null}
      {mutation.isError ? (
        <Alert className="mt-5" variant="error">
          {getApiErrorMessage(mutation.error, 'Unable to submit review')}
        </Alert>
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
        <Textarea
          className="min-h-32"
          error={errors.comment?.message}
          label="Comment (optional)"
          placeholder="Tell us about your experience"
          {...register('comment')}
        />
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Link
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            to="/client/bookings"
          >
            Cancel
          </Link>
          <Button disabled={!bookingId} loading={mutation.isPending} loadingText="Submitting..." type="submit">
            Submit Review
          </Button>
        </div>
      </form>
    </Card>
  )
}
