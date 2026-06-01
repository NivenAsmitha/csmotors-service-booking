import type { UserRole } from '../types/auth'

export const dashboardPaths: Record<UserRole, string> = {
  developer: '/developer/dashboard',
  admin: '/admin/dashboard',
  it_support: '/it-support/dashboard',
  employee: '/employee/dashboard',
  client: '/client/dashboard',
}

export function getDashboardPath(role: UserRole) {
  return dashboardPaths[role]
}
