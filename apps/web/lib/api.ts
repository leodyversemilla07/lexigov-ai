/**
 * API Client for making authenticated requests to the backend
 * 
 * Automatically attaches Firebase ID token to requests
 */

import { getIdToken } from './firebase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData
  requireAuth?: boolean
}

/**
 * Make an authenticated API request
 */
async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, requireAuth = true, headers = {}, ...rest } = options

  const requestHeaders: Record<string, string> = {
    ...(typeof headers === 'object' ? (headers as Record<string, string>) : {}),
  }

  // Add content type for JSON bodies
  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  // Add authentication token
  if (requireAuth) {
    const token = await getIdToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.error || `Request failed with status ${response.status}`,
      response.status,
      data
    )
  }

  return data as ApiResponse<T>
}

/**
 * API Error class
 */
export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * API client with common HTTP methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = unknown>(
    endpoint: string,
    body?: Record<string, unknown>,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ) => request<T>(endpoint, { ...options, method: 'POST', body }),

  /**
   * PUT request
   */
  put: <T = unknown>(
    endpoint: string,
    body?: Record<string, unknown>,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ) => request<T>(endpoint, { ...options, method: 'PUT', body }),

  /**
   * PATCH request
   */
  patch: <T = unknown>(
    endpoint: string,
    body?: Record<string, unknown>,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ) => request<T>(endpoint, { ...options, method: 'PATCH', body }),

  /**
   * DELETE request
   */
  delete: <T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

// Specific API services

/**
 * Auth API
 */
export const authApi = {
  /**
   * Verify token and sync user with backend
   */
  verifyToken: async (idToken: string) => {
    return api.post<{
      user: {
        id: string
        email: string
        name: string | null
        role: string
        organization: string | null
        emailVerified?: boolean
      }
      firebaseUid: string
    }>('/auth/verify-token', { idToken }, { requireAuth: false })
  },

  /**
   * Get current user
   */
  getMe: async () => {
    return api.get<{
      user: {
        id: string
        email: string
        name: string | null
        role: string
        organization: string | null
        emailVerified?: boolean
      }
    }>('/auth/me')
  },

  /**
   * Update profile
   */
  updateProfile: async (data: { name?: string; organization?: string }) => {
    return api.put<{
      user: {
        id: string
        email: string
        name: string | null
        role: string
        organization: string | null
      }
    }>('/auth/profile', data)
  },
}

/**
 * Drafts API
 */
export const draftsApi = {
  /**
   * List drafts
   */
  list: async (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.status) searchParams.set('status', params.status)
    const query = searchParams.toString()
    return api.get(`/drafts${query ? `?${query}` : ''}`)
  },

  /**
   * Get draft by ID
   */
  get: async (id: string) => {
    return api.get(`/drafts/${id}`)
  },

  /**
   * Create draft
   */
  create: async (data: {
    title: string
    content: object
    documentType: string
  }) => {
    return api.post('/drafts', data)
  },

  /**
   * Update draft
   */
  update: async (id: string, data: Partial<{
    title: string
    content: object
    documentType: string
    status: string
  }>) => {
    return api.put(`/drafts/${id}`, data)
  },

  /**
   * Delete draft
   */
  delete: async (id: string) => {
    return api.delete(`/drafts/${id}`)
  },
}

/**
 * Templates API
 */
export const templatesApi = {
  /**
   * List templates
   */
  list: async (params?: { category?: string; jurisdictionLevel?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set('category', params.category)
    if (params?.jurisdictionLevel) searchParams.set('jurisdictionLevel', params.jurisdictionLevel)
    const query = searchParams.toString()
    return api.get(`/templates${query ? `?${query}` : ''}`)
  },

  /**
   * Get template by ID
   */
  get: async (id: string) => {
    return api.get(`/templates/${id}`)
  },
}

/**
 * AI API
 */
export const aiApi = {
  /**
   * Generate ordinance
   */
  generate: async (params: {
    documentType: string
    subject: string
    description: string
    jurisdiction: {
      level: string
      province?: string
      city?: string
      barangay?: string
    }
    templateId?: string
  }) => {
    return api.post('/ai/generate', params)
  },

  /**
   * Check compliance
   */
  checkCompliance: async (draftId: string) => {
    return api.post(`/compliance/check/${draftId}`)
  },
}
