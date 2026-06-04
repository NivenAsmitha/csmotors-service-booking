import api from '../../api/axios'
import type { InternalUserRole, User } from '../../types/user'
import type { AuthUser } from '../../types/auth'

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

export type ResetUserPasswordPayload = {
  newPassword: string
  must_change_password?: boolean
}

export type UpdateMyProfilePayload = {
  name?: string
  email?: string
  phone?: string
}

export type UpdateMyProfileResponse = {
  message: string
  user: AuthUser
}

export type ChangeMyPasswordPayload = {
  old_password: string
  new_password: string
}

export type ChangeMyPasswordResponse = {
  user: AuthUser
}

export type ActiveEmployee = Pick<
  User,
  'id' | 'name' | 'email' | 'phone' | 'role' | 'is_active'
>

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

export async function resetUserPassword(
  id: string,
  payload: ResetUserPasswordPayload,
) {
  const response = await api.patch<User>(`/users/${id}/password`, payload)
  return response.data
}

export async function getMyProfile() {
  const response = await api.get<AuthUser>('/users/me')
  return response.data
}

export async function updateMyProfile(payload: UpdateMyProfilePayload) {
  const response = await api.patch<UpdateMyProfileResponse>('/users/me', payload)
  return response.data
}

export async function changeMyPassword(payload: ChangeMyPasswordPayload) {
  const response = await api.post<ChangeMyPasswordResponse>(
    '/auth/change-password',
    payload,
  )
  return response.data
}

export async function getActiveEmployees() {
  const response = await api.get<ActiveEmployee[]>('/users/employees/active')
  return response.data
}
