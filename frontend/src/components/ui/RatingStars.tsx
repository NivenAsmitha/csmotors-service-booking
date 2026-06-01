import { Star } from 'lucide-react'

type RatingStarsProps = {
  rating: number
  showValue?: boolean
}

export function RatingStars({ rating, showValue = false }: RatingStarsProps) {
  return (
    <span className="inline-flex items-center gap-1" title={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          className={[
            'size-4',
            index < rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-100 text-slate-300',
          ].join(' ')}
          key={index}
        />
      ))}
      {showValue ? (
        <span className="ml-1 text-xs font-semibold text-slate-600">
          {rating}/5
        </span>
      ) : null}
    </span>
  )
}
