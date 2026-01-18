'use client'

/**
 * Firebase Authentication Hook for React
 * 
 * Provides reactive auth state and common auth methods
 */

import { useState, useEffect, useCallback } from 'react'
import {
  onAuthChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  resetPassword,
  getIdToken,
  updateUserProfile,
  type User,
} from '@/lib/firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signInGoogle: () => Promise<void>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  getToken: (forceRefresh?: boolean) => Promise<string | null>
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
      }))
    })

    return unsubscribe
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // Sign in with email
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      await signInWithEmail(email, password)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      throw error
    }
  }, [])

  // Sign up with email
  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))
        await signUpWithEmail(email, password, displayName)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign up failed'
        setState((prev) => ({ ...prev, loading: false, error: message }))
        throw error
      }
    },
    []
  )

  // Sign in with Google
  const signInGoogle = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      await signInWithGoogle()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign in failed'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      throw error
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      await signOut()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      throw error
    }
  }, [])

  // Send password reset
  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      await resetPassword(email)
      setState((prev) => ({ ...prev, loading: false }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed'
      setState((prev) => ({ ...prev, loading: false, error: message }))
      throw error
    }
  }, [])

  // Get ID token
  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    return getIdToken(forceRefresh)
  }, [])

  // Update profile
  const updateProfileFn = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))
        await updateUserProfile(data)
        setState((prev) => ({ ...prev, loading: false }))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Profile update failed'
        setState((prev) => ({ ...prev, loading: false, error: message }))
        throw error
      }
    },
    []
  )

  return {
    ...state,
    signIn,
    signUp,
    signInGoogle,
    logout,
    sendPasswordReset,
    getToken,
    updateProfile: updateProfileFn,
    clearError,
  }
}
