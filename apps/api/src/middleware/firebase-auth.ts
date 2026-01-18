/**
 * Firebase Authentication Middleware for Fastify
 * 
 * Verifies Firebase ID tokens and attaches user info to requests
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyIdToken } from '../lib/firebase-admin.js'
import { prisma } from '@repo/db'

/**
 * Decoded Firebase user attached to request
 */
export interface FirebaseUser {
  uid: string
  email?: string
  emailVerified?: boolean
  displayName?: string
  picture?: string
}

/**
 * Database user attached to request
 */
export interface DbUser {
  id: string
  email: string
  name: string | null
  role: string
  organization: string | null
  firebaseUid: string | null
}

/**
 * Authenticated request with user info
 */
export interface AuthenticatedRequest extends FastifyRequest {
  firebaseUser: FirebaseUser
  user: DbUser
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization
  
  if (!authHeader) {
    return null
  }
  
  const parts = authHeader.split(' ')
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1] ?? null
}

/**
 * Firebase authentication middleware
 * Verifies the ID token and attaches user to request
 */
export async function firebaseAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractBearerToken(request)
  
  if (!token) {
    return reply.code(401).send({
      success: false,
      error: 'No authentication token provided',
      timestamp: new Date().toISOString(),
    })
  }
  
  // Verify the token with Firebase
  const result = await verifyIdToken(token)
  
  if (!result.success) {
    return reply.code(401).send({
      success: false,
      error: result.error || 'Invalid authentication token',
      timestamp: new Date().toISOString(),
    })
  }
  
  // Attach Firebase user to request
  const firebaseUser: FirebaseUser = {
    uid: result.uid!,
    email: result.email,
    emailVerified: result.emailVerified,
    displayName: result.displayName,
    picture: result.picture,
  }
  ;(request as AuthenticatedRequest).firebaseUser = firebaseUser
  
  // Find or create user in database
  try {
    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid: result.uid },
    })
    
    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          firebaseUid: result.uid!,
          email: result.email || `${result.uid}@unknown.com`,
          name: result.displayName,
          role: 'LEGISLATIVE_STAFF', // Default role
        },
      })
    }
    
    // Attach database user to request
    ;(request as AuthenticatedRequest).user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      organization: dbUser.organization,
      firebaseUid: dbUser.firebaseUid,
    }
  } catch (error) {
    request.log.error(error, 'Failed to find/create user in database')
    return reply.code(500).send({
      success: false,
      error: 'Failed to authenticate user',
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't reject if no token
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const token = extractBearerToken(request)
  
  if (!token) {
    return // Continue without user
  }
  
  const result = await verifyIdToken(token)
  
  if (!result.success) {
    return // Continue without user
  }
  
  // Attach Firebase user to request
  ;(request as AuthenticatedRequest).firebaseUser = {
    uid: result.uid!,
    email: result.email,
    emailVerified: result.emailVerified,
    displayName: result.displayName,
    picture: result.picture,
  }
  
  // Find user in database (don't create)
  try {
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: result.uid },
    })
    
    if (dbUser) {
      ;(request as AuthenticatedRequest).user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        organization: dbUser.organization,
        firebaseUid: dbUser.firebaseUid,
      }
    }
  } catch (error) {
    request.log.error(error, 'Failed to find user in database')
  }
}

/**
 * Role-based access control middleware factory
 * @param allowedRoles - Array of roles that can access the route
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First ensure user is authenticated
    await firebaseAuthMiddleware(request, reply)
    
    // Check if reply was already sent (auth failed)
    if (reply.sent) {
      return
    }
    
    const user = (request as AuthenticatedRequest).user
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      })
    }
    
    if (!allowedRoles.includes(user.role)) {
      return reply.code(403).send({
        success: false,
        error: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
