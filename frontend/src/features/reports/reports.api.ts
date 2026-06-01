import api from '../../api/axios'
import type { BookingClient, BookingStatus } from '../../types/booking'

export type SummaryReport = {
  total_users: number
  total_clients: number
  total_employees: number
  total_bookings: number
  today_bookings: number
  pending_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  average_rating: number | null
  active_services_count: number
}

export type ServiceBookingCount = {
  service_id: string
  service_name: string
  count: number
}

export type BookingStatusCounts = Record<BookingStatus, number>

export type DailyReport = {
  date: string
  total_bookings: number
  confirmed_count: number
  pending_count: number
  in_progress_count: number
  completed_count: number
  cancelled_count: number
  bookings_by_service: ServiceBookingCount[]
  employee_assignments: number
  average_rating: number | null
  reviews_count: number
}

export type DateBookingCount = {
  date: string
  count: number
}

export type WeeklyReport = {
  start_date: string
  end_date: string
  total_bookings: number
  bookings_by_day: DateBookingCount[]
  bookings_by_status: BookingStatusCounts
  bookings_by_service: ServiceBookingCount[]
  completed_count: number
  cancelled_count: number
  average_rating: number | null
}

export type MonthlyReport = {
  year: number
  month: number
  total_bookings: number
  bookings_by_day: DateBookingCount[]
  bookings_by_status: BookingStatusCounts
  bookings_by_service: ServiceBookingCount[]
  completed_count: number
  cancelled_count: number
  reviews_count: number
  average_rating: number | null
}

export type EmployeeReportAssignment = {
  assignment_id: string
  vehicle_ref?: string | null
  scheduled_time?: string | null
  assigned_at: string
  booking_id: string
  booking_status: BookingStatus
  bike_number?: string | null
  bike_model?: string | null
  client: BookingClient
  service: {
    id: string
    name: string
  }
  slot_label: string
  date: string
}

export type EmployeeReport = {
  employee_id: string
  employee_name: string
  employee_email: string
  assigned_count: number
  completed_count: number
  in_progress_count: number
  cancelled_count: number
  average_rating: number | null
  reviews_count: number
  recent_assignments: EmployeeReportAssignment[]
}

export async function getSummaryReport() {
  const response = await api.get<SummaryReport>('/reports/summary')
  return response.data
}

export async function getDailyReport(date: string) {
  const response = await api.get<DailyReport>('/reports/daily', {
    params: { date },
  })
  return response.data
}

export async function getWeeklyReport(start: string) {
  const response = await api.get<WeeklyReport>('/reports/weekly', {
    params: { start },
  })
  return response.data
}

export async function getMonthlyReport(year: number, month: number) {
  const response = await api.get<MonthlyReport>('/reports/monthly', {
    params: { year, month },
  })
  return response.data
}

export async function getEmployeeReport(employeeId: string) {
  const response = await api.get<EmployeeReport>(
    `/reports/employee/${employeeId}`,
  )
  return response.data
}
