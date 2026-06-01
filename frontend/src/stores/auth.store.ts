import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

const AUTH_STORAGE_KEY = 'cs-motors-auth'

type StoredAuth = {
  user: AuthUser
  accessToken: string
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  hasHydrated: boolean
  isAuthenticated: boolean
  login: (user: AuthUser, accessToken: string) => void
  logout: () => void
  loadFromStorage: () => void
  updateUser: (user: AuthUser) => void
}

function readStoredAuth(): StoredAuth | null {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedAuth) {
    return null
  }

  try {
    const parsedAuth = JSON.parse(storedAuth) as Partial<StoredAuth>

    if (!parsedAuth.user || typeof parsedAuth.accessToken !== 'string') {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return {
      user: parsedAuth.user,
      accessToken: parsedAuth.accessToken,
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function getStoredAccessToken() {
  return readStoredAuth()?.accessToken ?? null
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  hasHydrated: false,
  isAuthenticated: false,
  login: (user, accessToken) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, accessToken }))
    set({ user, accessToken, hasHydrated: true, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    set({
      user: null,
      accessToken: null,
      hasHydrated: true,
      isAuthenticated: false,
    })
  },
  loadFromStorage: () => {
    const storedAuth = readStoredAuth()

    if (!storedAuth) {
      set({
        user: null,
        accessToken: null,
        hasHydrated: true,
        isAuthenticated: false,
      })
      return
    }

    set({
      user: storedAuth.user,
      accessToken: storedAuth.accessToken,
      hasHydrated: true,
      isAuthenticated: true,
    })
  },
  updateUser: (user) => {
    const storedAuth = readStoredAuth()

    if (!storedAuth) {
      return
    }

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user, accessToken: storedAuth.accessToken }),
    )
    set({ user })
  },
}))
