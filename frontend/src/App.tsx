import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { useAuthStore } from './stores/auth.store'

function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  if (!hasHydrated) {
    return <LoadingScreen />
  }

  return <RouterProvider router={router} />
}

export default App
