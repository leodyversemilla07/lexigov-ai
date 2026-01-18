import { ZodError, z } from 'z';

/**
 * Standardized API response format
 */
export interface ApiResponse<T = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create success response
 */
export function successResponse<T>(data: T): ApiResponse {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  message?: string
): ApiResponse {
  return {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate request with Zod
 */
export function validateRequest<T extends z.ZodType>(
  schema: z.ZodType<T>,
  data: unknown
): { success: boolean; errors: ZodError[]; data?: T } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors || [];
    return {
      success: false,
      errors,
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
}

/**
 * Handle errors consistently
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DUPLICATE: 'DUPLICATE',
} as const;
