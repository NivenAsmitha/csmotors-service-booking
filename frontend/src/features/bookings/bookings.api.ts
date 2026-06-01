import api from '../../api/axios'
import type { Booking, BookingStatus } from '../../types/booking'

type CreateBookingPayload = {
  day_slot_id: string
  notes?: string
}

export async function createBooking(payload: CreateBookingPayload) {
  const response = await api.post<Booking>('/bookings', payload)
  return response.data
}

export async function getMyBookings() {
  const response = await api.get<Booking[]>('/bookings')
  return response.data
}

export type BookingFilters = {
  status?: BookingStatus
  date?: string
  service_id?: string
}

export async function getBookings(filters?: BookingFilters) {
  const response = await api.get<Booking[]>('/bookings', { params: filters })
  return response.data
}

export async function getBooking(id: string) {
  const response = await api.get<Booking>(`/bookings/${id}`)
  return response.data
}

export async function cancelBooking(id: string) {
  const response = await api.patch<Booking>(`/bookings/${id}/cancel`)
  return response.data
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const response = await api.patch<Booking>(`/bookings/${id}/status`, {
    status,
  })
  return response.data
}
