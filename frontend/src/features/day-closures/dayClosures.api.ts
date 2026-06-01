import api from '../../api/axios'

export type DayClosure = {
  id: string
  date: string
  reason?: string | null
  closed_by: string
  created_at: string
}

type CreateDayClosurePayload = {
  date: string
  reason?: string
}

export async function getDayClosures() {
  const response = await api.get<DayClosure[]>('/day-closures')
  return response.data
}

export async function createDayClosure(payload: CreateDayClosurePayload) {
  const response = await api.post<DayClosure>('/day-closures', payload)
  return response.data
}

export async function deleteDayClosure(date: string) {
  const response = await api.delete<{ message: string }>(
    `/day-closures/${date}`,
  )
  return response.data
}
