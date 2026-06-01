import type { Service } from './service'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type BookingSlot = {
  id: string
  service_id: string
  label: string
  show_time: boolean
  display_time: boolean
  start_time?: string
  end_time?: string
  service: Service
}

export type BookingDaySlot = {
  id: string
  slot_id: string
  date: string
  max_bookings: number
  is_closed: boolean
  show_time_override: boolean | null
  slot: BookingSlot
}

export type BookingAssignment = {
  id: string
  employee_id: string
  vehicle_ref?: string | null
  scheduled_time?: string | null
}

export type BookingClient = {
  id: string
  name: string
  email: string
  phone?: string | null
}

export type BookingReview = {
  id: string
  rating: number
  comment?: string | null
}

export type Booking = {
  id: string
  client_id: string
  day_slot_id: string
  status: BookingStatus
  notes?: string | null
  created_at: string
  updated_at: string
  client: BookingClient
  daySlot: BookingDaySlot
  assignment?: BookingAssignment | null
  review?: BookingReview | null
}
