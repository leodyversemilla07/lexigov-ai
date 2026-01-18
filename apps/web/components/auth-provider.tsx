'use client'

/**
 * Auth Context Provider
 * 
 * Wraps the app to provide authentication state and methods
 */

import { createContext, useContext, type ReactNode } from 'react'
import { useAuth, type UseAuthReturn } from '@/hooks/use-auth'

const AuthContext = createContext<UseAuthReturn | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}
