import api from '../../api/axios'
import type { InternalUserRole, User } from '../../types/user'

export type CreateUserPayload = {
  name: string
  email: string
  phone?: string
  password: string
  role: InternalUserRole
}

export type UpdateUserPayload = {
  name?: string
  phone?: string
  is_active?: boolean
  role?: InternalUserRole
}

export async function getUsers() {
  const response = await api.get<User[]>('/users')
  return response.data
}

export async function getUser(id: string) {
  const response = await api.get<User>(`/users/${id}`)
  return response.data
}

export async function createUser(payload: CreateUserPayload) {
  const response = await api.post<User>('/users', payload)
  return response.data
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const response = await api.patch<User>(`/users/${id}`, payload)
  return response.data
}

export async function deactivateUser(id: string) {
  const response = await api.delete<User>(`/users/${id}`)
  return response.data
}
