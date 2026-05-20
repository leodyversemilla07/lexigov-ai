'use client'

/**
 * Authentication Hook - DEPRECATED
 * 
 * This project now uses Clerk for authentication.
 * Import hooks directly from @clerk/nextjs instead:
 * 
 * import { useUser, useAuth } from '@clerk/nextjs'
 * 
 * This file is kept for reference but should not be used.
 */

export function useAuth() {
  console.warn('useAuth from @/hooks/use-auth is deprecated. Use useUser or useAuth from @clerk/nextjs instead.')
  return {
    user: null,
    loading: false,
    error: null,
    signIn: async () => {},
    signUp: async () => {},
    signInGoogle: async () => {},
    logout: async () => {},
    sendPasswordReset: async () => {},
    getToken: async () => null,
    updateProfile: async () => {},
    clearError: () => {},
  }
}
