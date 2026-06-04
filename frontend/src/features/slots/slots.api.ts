import api from '../../api/axios'
import type { Service, Slot } from '../../types/service'

export type TimeSlot = {
  id: string
  service_id: string
  label: string
  start_time: string | null
  end_time: string | null
  is_default: boolean
  show_time: boolean
}

export type SlotsConfigService = Service & {
  timeSlots: TimeSlot[]
}

export type CreateExtraDaySlotPayload = {
  service_id: string
  date: string
  extra_count: number
  show_time_override?: boolean | null
}

export async function getSlotsConfig() {
  const response = await api.get<SlotsConfigService[]>('/slots/config')
  return response.data
}

export async function getServiceSlots(serviceId: string, date: string) {
  const response = await api.get<Slot[]>(`/services/${serviceId}/slots`, {
    params: { date },
  })
  return response.data
}

export async function updateDaySlotClosed(
  daySlotId: string,
  is_closed: boolean,
) {
  const response = await api.patch(`/day-slots/${daySlotId}/close`, {
    is_closed,
  })
  return response.data
}

export async function createExtraDaySlot(payload: CreateExtraDaySlotPayload) {
  const response = await api.post('/day-slots/extra', payload)
  return response.data
}
