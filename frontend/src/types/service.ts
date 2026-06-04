export type Service = {
  id: string
  name: string
  description?: string | null
  details?: string[] | null
  duration_minutes: number
  max_bookings_per_slot: number
  is_active: boolean
}

export type Slot = {
  day_slot_id: string
  slot_id: string
  label: string
  display_label: string
  display_time: boolean
  date: string
  max_bookings: number
  booked_count: number
  available: boolean
  is_closed: boolean
  is_extra?: boolean
  show_time_override?: boolean | null
  reason?: string
  start_time?: string | null
  end_time?: string | null
}
