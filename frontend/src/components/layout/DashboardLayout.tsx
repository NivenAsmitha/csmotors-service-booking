import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  function handleConfirmLogout() {
    setIsLogoutConfirmOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <Navbar
          onLogoutClick={() => setIsLogoutConfirmOpen(true)}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="mx-auto max-w-400 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog
        cancelText="No"
        confirmText="Yes"
        message="Are you sure you want to logout?"
        onCancel={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        open={isLogoutConfirmOpen}
        title="Confirm Logout"
        variant="warning"
      />
    </div>
  )
}
