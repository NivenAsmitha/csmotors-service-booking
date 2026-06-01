import axios from 'axios'
import api from '../../api/axios'
import type { AuthUser } from '../../types/auth'

type LoginPayload = {
  email: string
  password: string
}

type LoginResponse = {
  access_token: string
  user: AuthUser
}

type RegisterPayload = {
  name: string
  email: string
  phone?: string
  password: string
}

type RegisterResponse = {
  user: AuthUser
}

type ChangePasswordPayload = {
  old_password: string
  new_password: string
}

type ChangePasswordResponse = {
  user: AuthUser
}

type ErrorResponse = {
  message?: string | string[]
}

export async function login(payload: LoginPayload) {
  const response = await api.post<LoginResponse>('/auth/login', payload)
  return response.data
}

export async function register(payload: RegisterPayload) {
  const response = await api.post<RegisterResponse>('/auth/register', payload)
  return response.data
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await api.post<ChangePasswordResponse>(
    '/auth/change-password',
    payload,
  )
  return response.data
}

export function getAuthErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError<ErrorResponse>(error)) {
    return fallbackMessage
  }

  const message = error.response?.data.message

  if (Array.isArray(message)) {
    return message.join('. ')
  }

  return message ?? fallbackMessage
}
