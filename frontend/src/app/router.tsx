import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AdminBookingsPage } from '../pages/admin/AdminBookingsPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminReportsPage } from '../pages/admin/AdminReportsPage'
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage'
import { AdminServicesPage } from '../pages/admin/AdminServicesPage'
import { AdminSlotsPage } from '../pages/admin/AdminSlotsPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { BookServicePage } from '../pages/client/BookServicePage'
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage'
import { LeaveReviewPage } from '../pages/client/LeaveReviewPage'
import { MyBookingsPage } from '../pages/client/MyBookingsPage'
import { AuditLogsPage } from '../pages/developer/AuditLogsPage'
import { DeveloperDashboardPage } from '../pages/developer/DeveloperDashboardPage'
import { EmployeeDashboardPage } from '../pages/employee/EmployeeDashboardPage'
import { EmployeeReviewsPage } from '../pages/employee/EmployeeReviewsPage'
import { AssignmentBoardPage } from '../pages/it-support/AssignmentBoardPage'
import { ItSupportDashboardPage } from '../pages/it-support/ItSupportDashboardPage'
import { HomePage } from '../pages/public/HomePage'
import { LoginPage } from '../pages/public/LoginPage'
import { RegisterPage } from '../pages/public/RegisterPage'
import { ChangePasswordPage } from '../pages/public/ChangePasswordPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'
import { VerifyEmailPage } from '../pages/public/VerifyEmailPage'
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute
        allowPasswordChange
        allowedRoles={['developer', 'admin', 'it_support', 'employee', 'client']}
      />
    ),
    children: [{ path: '/change-password', element: <ChangePasswordPage /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['client']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/client/dashboard', element: <ClientDashboardPage /> },
          { path: '/client/book-service', element: <BookServicePage /> },
          { path: '/client/bookings', element: <MyBookingsPage /> },
          { path: '/client/reviews/new', element: <LeaveReviewPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin', 'developer']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/services', element: <AdminServicesPage /> },
          { path: '/admin/slots', element: <AdminSlotsPage /> },
          { path: '/admin/bookings', element: <AdminBookingsPage /> },
          { path: '/admin/reports', element: <AdminReportsPage /> },
          { path: '/admin/reviews', element: <AdminReviewsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['it_support', 'admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/it-support/dashboard',
            element: <ItSupportDashboardPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['it_support', 'admin', 'developer']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/it-support/assignments', element: <AssignmentBoardPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['employee']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/employee/dashboard',
            element: <EmployeeDashboardPage />,
          },
          { path: '/employee/reviews', element: <EmployeeReviewsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['developer']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/developer/dashboard',
            element: <DeveloperDashboardPage />,
          },
          { path: '/developer/audit-logs', element: <AuditLogsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
