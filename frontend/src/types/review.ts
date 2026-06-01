import type { BookingStatus } from './booking'

export type ReviewUser = {
  id: string
  name: string
  email: string
}

export type Review = {
  id: string
  booking_id: string
  client_id: string
  employee_id: string
  rating: number
  comment?: string | null
  created_at: string
  updated_at: string
  client?: ReviewUser
  employee?: ReviewUser
  booking?: {
    id: string
    status: BookingStatus
    date: string
    service: {
      id: string
      name: string
    }
  }
}
