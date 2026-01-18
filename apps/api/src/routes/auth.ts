import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { ApiError, successResponse, errorResponse } from '../utils/response.js'
import { prisma, UserRole } from '@repo/db'
import { verifyIdToken, getUserByUid, setCustomClaims } from '../lib/firebase-admin.js'
import { firebaseAuthMiddleware, type AuthenticatedRequest, type FirebaseUser } from '../middleware/firebase-auth.js'

/**
 * Authentication routes plugin
 * 
 * These routes handle Firebase-based authentication:
 * - /auth/verify-token: Verify Firebase ID token and sync user to database
 * - /auth/me: Get current authenticated user
 * - /auth/profile: Update user profile
 * - /auth/logout: Logout (handled client-side, server just acknowledges)
 */
export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * POST /auth/verify-token
   * Verify Firebase ID token and sync user to database
   * This is the main authentication endpoint for the frontend
   */
  fastify.post<{
    Body: {
      idToken: string
    }
  }>(
    '/auth/verify-token',
    {
      schema: {
        body: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { idToken } = request.body

        // Verify the Firebase ID token
        const result = await verifyIdToken(idToken)

        if (!result.success || !result.uid) {
          throw new ApiError(result.error || 'Invalid token', 401)
        }

        // Find or create user in database
        let user = await prisma.user.findUnique({
          where: { firebaseUid: result.uid },
        })

        if (!user) {
          // Create new user from Firebase data
          user = await prisma.user.create({
            data: {
              firebaseUid: result.uid,
              email: result.email || `${result.uid}@unknown.com`,
              name: result.displayName,
              role: 'LEGISLATIVE_STAFF', // Default role
            },
          })

          // Set custom claims in Firebase for role-based access
          await setCustomClaims(result.uid, { role: user.role })
        }

        return reply.code(200).send(
          successResponse({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              organization: user.organization,
              emailVerified: result.emailVerified,
            },
            firebaseUid: result.uid,
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Token verification error')
        return reply.code(500).send(errorResponse('Token verification failed'))
      }
    }
  )

  /**
   * GET /auth/firebase-user/:uid
   * Get Firebase user details by UID (admin only)
   */
  fastify.get<{
    Params: { uid: string }
  }>(
    '/auth/firebase-user/:uid',
    {
      preHandler: firebaseAuthMiddleware,
      schema: {
        params: {
          type: 'object',
          required: ['uid'],
          properties: {
            uid: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const authRequest = request as AuthenticatedRequest
        
        // Only admins can lookup other users
        if (authRequest.user.role !== 'ADMIN') {
          throw new ApiError('Insufficient permissions', 403)
        }

        const { uid } = request.params
        const firebaseUser = await getUserByUid(uid)

        return reply.code(200).send(
          successResponse({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified,
              disabled: firebaseUser.disabled,
              createdAt: firebaseUser.metadata.creationTime,
              lastSignIn: firebaseUser.metadata.lastSignInTime,
            },
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Get Firebase user error')
        return reply.code(500).send(errorResponse('Failed to get Firebase user'))
      }
    }
  )

  /**
   * POST /auth/logout
   * Logout user (client-side mostly)
   */
  fastify.post(
    '/auth/logout',
    async (_request, reply) => {
      // Firebase logout is handled client-side
      return reply.code(200).send(successResponse({ message: 'Logged out successfully' }))
    }
  )

  /**
   * GET /auth/me
   * Get current user information (requires authentication)
   */
  fastify.get(
    '/auth/me',
    {
      preHandler: firebaseAuthMiddleware,
    },
    async (request, reply) => {
      try {
        const authRequest = request as AuthenticatedRequest
        const user = authRequest.user
        const firebaseUser = authRequest.firebaseUser

        return reply.code(200).send(
          successResponse({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              organization: user.organization,
              emailVerified: firebaseUser?.emailVerified,
            },
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Get user error')
        return reply.code(500).send(errorResponse('Failed to get user'))
      }
    }
  )

  /**
   * PUT /auth/profile
   * Update user profile
   */
  fastify.put<{
    Body: {
      name?: string
      organization?: string
    }
  }>(
    '/auth/profile',
    {
      preHandler: firebaseAuthMiddleware,
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            organization: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const authRequest = request as AuthenticatedRequest
        const { name, organization } = request.body

        // Update user in database
        const updatedUser = await prisma.user.update({
          where: { id: authRequest.user.id },
          data: {
            ...(name !== undefined && { name }),
            ...(organization !== undefined && { organization }),
          },
        })

        return reply.code(200).send(
          successResponse({
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              name: updatedUser.name,
              role: updatedUser.role,
              organization: updatedUser.organization,
            },
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Update profile error')
        return reply.code(500).send(errorResponse('Failed to update profile'))
      }
    }
  )

  /**
   * PUT /auth/role/:userId
   * Update user role (admin only)
   */
  fastify.put<{
    Params: { userId: string }
    Body: { role: string }
  }>(
    '/auth/role/:userId',
    {
      preHandler: firebaseAuthMiddleware,
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { 
              type: 'string',
              enum: ['ADMIN', 'LEGISLATIVE_STAFF', 'LEGAL_OFFICER', 'VIEWER'],
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const authRequest = request as AuthenticatedRequest
        
        // Only admins can change roles
        if (authRequest.user.role !== 'ADMIN') {
          throw new ApiError('Insufficient permissions', 403)
        }

        const { userId } = request.params
        const { role } = request.body

        // Update user in database
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { role: role as UserRole },
        })

        // Update custom claims in Firebase if user has firebaseUid
        if (updatedUser.firebaseUid) {
          await setCustomClaims(updatedUser.firebaseUid, { role })
        }

        return reply.code(200).send(
          successResponse({
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              name: updatedUser.name,
              role: updatedUser.role,
              organization: updatedUser.organization,
            },
          })
        )
      } catch (error) {
        if (error instanceof ApiError) {
          return reply.code(error.statusCode).send(errorResponse(error.message))
        }
        fastify.log.error(error, 'Update role error')
        return reply.code(500).send(errorResponse('Failed to update role'))
      }
    }
  )
}
