/**
 * Firebase Admin SDK Configuration
 * 
 * This file initializes Firebase Admin for server-side operations like:
 * - Verifying ID tokens
 * - Managing users
 * - Custom token minting
 * 
 * Setup Instructions:
 * 1. Go to Firebase Console > Project Settings > Service Accounts
 * 2. Click "Generate New Private Key"
 * 3. Save the JSON file securely
 * 4. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to the file path
 *    OR place the JSON content in FIREBASE_SERVICE_ACCOUNT_KEY env variable
 */

import { initializeApp, cert, getApps, type App, type ServiceAccount } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

let firebaseApp: App | undefined
let firebaseAuth: Auth | undefined

/**
 * Initialize Firebase Admin SDK
 * Uses Application Default Credentials (ADC) or explicit service account
 */
export function initializeFirebaseAdmin(): App {
  if (firebaseApp) {
    return firebaseApp
  }

  // Check if already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]
    return firebaseApp!
  }

  try {
    // Option 1: Use GOOGLE_APPLICATION_CREDENTIALS environment variable (recommended)
    // The SDK will automatically use this if set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseApp = initializeApp()
      console.log('Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS')
      return firebaseApp
    }

    // Option 2: Use inline service account JSON from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      })
      console.log('Firebase Admin initialized with service account JSON')
      return firebaseApp
    }

    // Option 3: Use individual environment variables
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }
      
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      console.log('Firebase Admin initialized with individual credentials')
      return firebaseApp
    }

    // Fallback: Try Application Default Credentials (works in Google Cloud environments)
    firebaseApp = initializeApp()
    console.log('Firebase Admin initialized with Application Default Credentials')
    return firebaseApp
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    throw new Error('Firebase Admin initialization failed. Check your credentials.')
  }
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (firebaseAuth) {
    return firebaseAuth
  }
  
  const app = initializeFirebaseAdmin()
  firebaseAuth = getAuth(app)
  return firebaseAuth
}

/**
 * Verify a Firebase ID token
 * @param idToken - The ID token to verify (from client)
 * @returns Decoded token with user info
 */
export async function verifyIdToken(idToken: string) {
  const auth = getFirebaseAuth()
  
  try {
    const decodedToken = await auth.verifyIdToken(idToken)
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name,
      picture: decodedToken.picture,
      token: decodedToken,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token verification failed'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string) {
  const auth = getFirebaseAuth()
  return auth.getUser(uid)
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const auth = getFirebaseAuth()
  return auth.getUserByEmail(email)
}

/**
 * Set custom claims on a user (for role-based access)
 */
export async function setCustomClaims(uid: string, claims: Record<string, unknown>) {
  const auth = getFirebaseAuth()
  await auth.setCustomUserClaims(uid, claims)
}

/**
 * Create a custom token for a user
 */
export async function createCustomToken(uid: string, claims?: Record<string, unknown>) {
  const auth = getFirebaseAuth()
  return auth.createCustomToken(uid, claims)
}

// Export types
export type { App, Auth }
