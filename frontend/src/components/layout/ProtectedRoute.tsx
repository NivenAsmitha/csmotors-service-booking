import { Navigate, Outlet } from 'react-router-dom'
import { LoadingScreen } from '../ui/LoadingScreen'
import { useAuthStore } from '../../stores/auth.store'
import type { UserRole } from '../../types/auth'
import { getDashboardPath } from '../../utils/routes'

type ProtectedRouteProps = {
  allowedRoles: UserRole[]
  allowPasswordChange?: boolean
}

export function ProtectedRoute({
  allowedRoles,
  allowPasswordChange = false,
}: ProtectedRouteProps) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!hasHydrated) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || !user) {
    return <Navigate replace to="/login" />
  }

  if (user.must_change_password && !allowPasswordChange) {
    return <Navigate replace to="/change-password" />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={getDashboardPath(user.role)} />
  }

  return <Outlet />
}
