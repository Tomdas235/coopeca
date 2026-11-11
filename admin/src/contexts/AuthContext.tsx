import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getProfile, loadToken } from '../services/auth'
import type { UserProfile } from '../types/api'
import { PAGE_PERMISSIONS, AdminPage } from '../config/permissions'

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  hasPermission: (page: AdminPage) => boolean
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      try {
        const token = loadToken()
        if (token) {
          const profile = await getProfile()
          if (mounted) setUser(profile)
        }
      } catch {
        // profil inaccessible, user reste null
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    void loadProfile()
    return () => { mounted = false }
  }, [])

  const refetchProfile = async () => {
    setIsLoading(true)
    try {
      const profile = await getProfile()
      setUser(profile)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const hasPermission = (page: AdminPage): boolean => {
    if (!user) return false
    const pages = PAGE_PERMISSIONS[user.role as keyof typeof PAGE_PERMISSIONS]
    if (!pages) return false
    return pages.includes(page)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, hasPermission, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider')
  }
  return context
}
