export type UserRole =
  | 'developer'
  | 'admin'
  | 'it_support'
  | 'employee'
  | 'client'

export type AuthUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: UserRole
  is_active?: boolean
  email_verified?: boolean
  must_change_password: boolean
}
