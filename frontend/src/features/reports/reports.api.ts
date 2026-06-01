import api from '../../api/axios'

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

export async function getSummaryReport() {
  const response = await api.get<SummaryReport>('/reports/summary')
  return response.data
}
