import api from '../../api/axios'
import type { Service, Slot } from '../../types/service'

export type TimeSlot = {
  id: string
  service_id: string
  label: string
  start_time: string
  end_time: string
  is_default: boolean
  show_time: boolean
}

export type SlotsConfigService = Service & {
  timeSlots: TimeSlot[]
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

export async function updateSlotTimeMode(slotId: string, show_time: boolean) {
  const response = await api.patch<TimeSlot>(`/slots/${slotId}/time-mode`, {
    show_time,
  })
  return response.data
}

export async function updateDaySlotTimeMode(
  daySlotId: string,
  show_time_override: boolean | null,
) {
  const response = await api.patch(`/day-slots/${daySlotId}/time-mode`, {
    show_time_override,
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
