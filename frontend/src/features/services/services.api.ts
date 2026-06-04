import api from '../../api/axios'
import type { Service, Slot } from '../../types/service'

export type UpdateServicePayload = {
  name?: string
  description?: string
  details?: string[]
  duration_minutes?: number
  max_bookings_per_slot?: number
  is_active?: boolean
}

export async function getServices() {
  const response = await api.get<Service[]>('/services')
  return response.data
}

export async function getAdminServices() {
  const response = await api.get<Service[]>('/services/admin/all')
  return response.data
}

export async function updateService(id: string, payload: UpdateServicePayload) {
  const response = await api.patch<Service>(`/services/${id}`, payload)
  return response.data
}

export async function getServiceSlots(serviceId: string, date: string) {
  const response = await api.get<Slot[]>(`/services/${serviceId}/slots`, {
    params: { date },
  })
  return response.data
}
