import type { UserRole } from './auth'

export type User = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  is_active: boolean
  must_change_password: boolean
  created_at: string
  updated_at: string
}

export type InternalUserRole = Extract<
  UserRole,
  'admin' | 'it_support' | 'employee'
>
