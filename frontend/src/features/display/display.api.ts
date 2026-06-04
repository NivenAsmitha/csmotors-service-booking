import api from '../../api/axios'
import type { BookingStatus } from '../../types/booking'

export type TodayServicesDisplaySetting = {
  enabled: boolean
}

export type TodayServiceDisplayItem = {
  booking_id: string
  service_name: string
  slot_label: string
  bike_number?: string | null
  bike_model?: string | null
  employee_name: string
  status: BookingStatus
}

export type TodayServicesDisplayResponse = {
  enabled: boolean
  date?: string
  services: TodayServiceDisplayItem[]
}

export async function getTodayServicesDisplay(date?: string) {
  const response = await api.get<TodayServicesDisplayResponse>(
    '/display/today-services',
    {
      params: date ? { date } : undefined,
    },
  )
  return response.data
}

export async function getTodayServicesDisplaySetting() {
  const response = await api.get<TodayServicesDisplaySetting>(
    '/settings/today-services-display',
  )
  return response.data
}

export async function updateTodayServicesDisplaySetting(enabled: boolean) {
  const response = await api.patch<TodayServicesDisplaySetting>(
    '/settings/today-services-display',
    { enabled },
  )
  return response.data
}
