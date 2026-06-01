import type { BookingStatus } from '../../types/booking'
import { Badge } from './Badge'

const statusVariants: Record<
  BookingStatus,
  'neutral' | 'info' | 'purple' | 'success' | 'danger'
> = {
  pending: 'neutral',
  confirmed: 'info',
  in_progress: 'purple',
  completed: 'success',
  cancelled: 'danger',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={statusVariants[status]}>{status.replace('_', ' ')}</Badge>
  )
}
