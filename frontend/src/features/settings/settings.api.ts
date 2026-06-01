import api from '../../api/axios'

export type GlobalTimeMode = {
  show_time: boolean
}

export async function getGlobalTimeMode() {
  const response = await api.get<GlobalTimeMode>('/settings/time-mode')
  return response.data
}

export async function updateGlobalTimeMode(show_time: boolean) {
  const response = await api.patch<GlobalTimeMode>('/settings/time-mode', {
    show_time,
  })
  return response.data
}
