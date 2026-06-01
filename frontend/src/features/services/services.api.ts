import api from '../../api/axios'
import type { Service, Slot } from '../../types/service'

export async function getServices() {
  const response = await api.get<Service[]>('/services')
  return response.data
}

export async function getServiceSlots(serviceId: string, date: string) {
  const response = await api.get<Slot[]>(`/services/${serviceId}/slots`, {
    params: { date },
  })
  return response.data
}
