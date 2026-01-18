import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiError, ErrorCodes } from './response.js';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organization?: string;
}

/**
 * Authenticated request with user info
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply,
  jwt: any
): Promise<void> {
  try {
    const token = extractToken(request);
    
    if (!token) {
      throw new ApiError('No authentication token provided', 401);
    }

    const decoded = await verifyToken(token);
    
    // Attach user to request object
    (request as any).user = decoded;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    reply.code(401).send({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Extract JWT token from request headers
 */
export function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] ?? null;
}

/**
 * Verify JWT token signature and expiration
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  // This would use the jwt secret to verify
  // Implementation depends on Firebase Auth or custom JWT
  // Placeholder for now
  return {
    userId: 'placeholder-user-id',
    email: 'user@example.com',
    role: 'LEGISLATIVE_STAFF',
  } as JwtPayload;
}

/**
 * Check if user has required role
 */
export function hasRole(user: JwtPayload, requiredRole: string): boolean {
  const roleHierarchy = {
    ADMIN: 5,
    LEGISLATIVE_STAFF: 4,
    BARANGAY_SECRETARY: 3,
    CITY_COUNCIL: 3,
    RESEARCHER: 2,
  };
  
  return (roleHierarchy[user.role as keyof typeof roleHierarchy] || 0) >= (roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0);
}

/**
 * Require authentication middleware
 */
export function requireAuth(
  requiredRole?: string[]
) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    // Token verification would be done here
    const user = (request as any).user;
    
    if (!user) {
      throw new ApiError('Authentication required', 401, ErrorCodes.UNAUTHORIZED);
    }
    
    // Check role requirements
    if (requiredRole && requiredRole.length > 0) {
      const hasRequiredRole = requiredRole.some(role => hasRole(user, role));
      
      if (!hasRequiredRole) {
        throw new ApiError(
          `Insufficient permissions. Required roles: ${requiredRole.join(', ')}`,
          403,
          ErrorCodes.FORBIDDEN
        );
      }
    }
  };
}
