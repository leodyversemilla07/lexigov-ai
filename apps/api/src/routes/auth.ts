import { FastifyInstance } from 'fastify'
import { ApiError, successResponse, errorResponse } from '../utils/response'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth'
import type { JwtPayload } from '../utils/auth'
import { prisma } from '@lexigov/db'

// Firebase configuration (should come from environment variables)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

/**
 * Register authentication routes
 */
export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const { email, password, name, organization } = request.body as any

      // Validate input
      if (!email || !password || !name) {
        throw new ApiError('Email, password, and name are required', 400)
      }

      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Create user in database
      const user = await prisma.user.create({
        data: {
          email,
          name,
          organization,
          firebaseUid: firebaseUser.uid,
          role: 'LEGISLATIVE_STAFF', // Default role
        },
      })

      return reply.code(201).send(successResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
        },
      }))
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.code === 'auth/email-already-in-use') {
        return reply.code(409).send(errorResponse('Email already registered'))
      }
      return reply.code(500).send(errorResponse('Registration failed'))
    }
  })

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body as any

      // Validate input
      if (!email || !password) {
        throw new ApiError('Email and password are required', 400)
      }

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Get Firebase ID token (for frontend)
      const idToken = await firebaseUser.getIdToken()

      // Find user in database
      let user = await prisma.user.findUnique({
        where: { firebaseUid: firebaseUser.uid },
      })

      // Create user in database if doesn't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: firebaseUser.email || email,
            name: firebaseUser.displayName || undefined,
            firebaseUid: firebaseUser.uid,
            role: 'LEGISLATIVE_STAFF',
          },
        })
      }

      return reply.code(200).send(successResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
        },
        token: idToken,
      }))
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return reply.code(401).send(errorResponse('Invalid email or password'))
      }
      return reply.code(500).send(errorResponse('Login failed'))
    }
  })

  /**
   * POST /api/auth/logout
   * Logout user (client-side mostly)
   */
  fastify.post('/auth/logout', async (request, reply) => {
    // Firebase logout is handled client-side
    // This endpoint can be used for server-side cleanup if needed
    return reply.code(200).send(successResponse({ message: 'Logged out successfully' }))
  })

  /**
   * GET /api/auth/me
   * Get current user information (requires authentication)
   */
  fastify.get('/auth/me', async (request, reply) => {
    try {
      const user = (request as any).user as JwtPayload

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Get full user from database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
      })

      if (!dbUser) {
        throw new ApiError('User not found', 404)
      }

      return reply.code(200).send(successResponse({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          organization: dbUser.organization,
        },
      }))
    } catch (error: any) {
      console.error('Get user error:', error)
      return reply.code(500).send(errorResponse('Failed to get user'))
    }
  })

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  fastify.put('/auth/profile', async (request, reply) => {
    try {
      const user = (request as any).user as JwtPayload
      const { name, organization } = request.body as any

      if (!user) {
        throw new ApiError('Unauthorized', 401)
      }

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: user.userId },
        data: {
          ...(name && { name }),
          ...(organization && { organization }),
        },
      })

      return reply.code(200).send(successResponse({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          organization: updatedUser.organization,
        },
      }))
    } catch (error: any) {
      console.error('Update profile error:', error)
      return reply.code(500).send(errorResponse('Failed to update profile'))
    }
  })
}
