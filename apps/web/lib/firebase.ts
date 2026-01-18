/**
 * Firebase Client SDK Configuration
 * 
 * This file initializes Firebase for client-side operations:
 * - User authentication (sign in, sign up, sign out)
 * - Getting ID tokens for API requests
 * 
 * Setup Instructions:
 * 1. Go to Firebase Console > Project Settings > General
 * 2. Scroll down to "Your apps" and click "Add app" > Web
 * 3. Copy the firebaseConfig values
 * 4. Add them to your .env.local file with NEXT_PUBLIC_ prefix
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
let app: FirebaseApp
let auth: Auth

export function initializeFirebase(): FirebaseApp {
  if (app) {
    return app
  }
  
  const existingApps = getApps()
  if (existingApps.length > 0) {
    app = existingApps[0]!
    auth = getAuth(app)
    return app
  }
  
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase()
  }
  return auth
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth()
  return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Create new account with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const auth = getFirebaseAuth()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  
  if (displayName && credential.user) {
    await updateProfile(credential.user, { displayName })
  }
  
  return credential
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  
  // Request additional scopes if needed
  provider.addScope('email')
  provider.addScope('profile')
  
  return signInWithPopup(auth, provider)
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  return firebaseSignOut(auth)
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth()
  return sendPasswordResetEmail(auth, email)
}

/**
 * Send email verification to current user
 */
export async function sendVerificationEmail(): Promise<void> {
  const auth = getFirebaseAuth()
  if (auth.currentUser) {
    return sendEmailVerification(auth.currentUser)
  }
  throw new Error('No user is currently signed in')
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

/**
 * Get the ID token for the current user
 * Use this token in API requests as Bearer token
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  
  if (!user) {
    return null
  }
  
  return user.getIdToken(forceRefresh)
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: {
  displayName?: string
  photoURL?: string
}): Promise<void> {
  const auth = getFirebaseAuth()
  
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in')
  }
  
  return updateProfile(auth.currentUser, data)
}

// Export types
export type { User, UserCredential, Auth }
