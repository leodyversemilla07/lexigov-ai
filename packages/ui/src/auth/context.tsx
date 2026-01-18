import * as React from "react"
import type { User as FirebaseUser } from "firebase/auth"
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"

// Firebase configuration (should come from environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
}

// Initialize Firebase
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

// User types
export interface User {
  id: string
  email: string
  name?: string
  role?: string
  organization?: string
  firebaseUid?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<User>
  register: (userData: UserRegister) => Promise<User>
  logout: () => Promise<void>
}

export interface UserRegister {
  name: string
  email: string
  password: string
  organization?: string
}

// Create context
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || undefined,
          firebaseUid: firebaseUser.uid,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    setError(null)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || undefined,
        firebaseUid: firebaseUser.uid,
      }

      setUser(userData)
      return userData
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Login failed")
      throw err
    }
  }

  const register = async (userData: UserRegister): Promise<User> => {
    setError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )
      const firebaseUser = userCredential.user

      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: userData.name,
        firebaseUid: firebaseUser.uid,
        organization: userData.organization,
      }

      setUser(newUser)
      return newUser
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Registration failed")
      throw err
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth)
      setUser(null)
    } catch (err: any) {
      console.error("Logout error:", err)
      setError(err.message || "Logout failed")
      throw err
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook for authentication
 */
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return {
    user: context.user,
    loading: context.loading,
    error: context.error,
    login: context.login,
    register: context.register,
    logout: context.logout,
    isAuthenticated: !!context.user,
  }
}

export { auth }
