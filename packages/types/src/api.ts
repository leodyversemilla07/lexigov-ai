/**
 * API Request/Response types
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  timestamp: string;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * JWT payload for authenticated requests
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organization?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated user info attached to request
 */
export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  organization?: string;
}

/**
 * Draft creation request
 */
export interface CreateDraftRequest {
  title: string;
  documentType: string;
  jurisdiction: string;
  jurisdictionName: string;
  content: Record<string, unknown>;
  templateId?: string;
  commitMessage?: string;
}

/**
 * Draft update request
 */
export interface UpdateDraftRequest {
  title?: string;
  content?: Record<string, unknown>;
  status?: string;
  commitMessage?: string;
  aiGenerated?: boolean;
}

/**
 * Template creation request
 */
export interface CreateTemplateRequest {
  name: string;
  category: string;
  subcategory?: string;
  jurisdiction?: string[];
  structure: Record<string, unknown>;
  exampleContent?: Record<string, unknown>;
  isPublic?: boolean;
}

/**
 * Template update request
 */
export interface UpdateTemplateRequest {
  name?: string;
  category?: string;
  subcategory?: string;
  jurisdiction?: string[];
  structure?: Record<string, unknown>;
  exampleContent?: Record<string, unknown>;
  isPublic?: boolean;
}

/**
 * AI ordinance generation request
 */
export interface GenerateOrdinanceRequest {
  prompt: string;
  jurisdiction: string;
  documentType: string;
  templateId?: string;
}

/**
 * Export request
 */
export interface ExportRequest {
  draftId: string;
  exportType: 'PDF' | 'DOCX';
  fileUrl?: string;
  fileSize?: number;
  pageCount?: number;
}

/**
 * Compliance check request
 */
export interface ComplianceCheckRequest {
  draftId: string;
  content?: Record<string, unknown>;
}

/**
 * User registration request
 */
export interface RegisterUserRequest {
  email: string;
  password: string;
  name: string;
  organization?: string;
}

/**
 * User login request
 */
export interface LoginUserRequest {
  email: string;
  password: string;
}

/**
 * User profile update request
 */
export interface UpdateProfileRequest {
  name?: string;
  organization?: string;
}

/**
 * Error codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DUPLICATE: 'DUPLICATE',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
