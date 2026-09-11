import type { ZodSchema } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  // Better Auth cookies are HttpOnly. Let the browser send them; never read or copy them into JS headers.
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    signal: options.signal,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: res.statusText };
    }
    const message =
      typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody
        ? String((errorBody as Record<string, unknown>).message)
        : `Request failed: ${res.status}`;
    throw new ApiError(res.status, message, errorBody);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function streamPost(
  path: string,
  body: unknown,
  onChunk: (chunk: string) => void,
  options: RequestOptions = {},
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    signal: options.signal,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: res.statusText };
    }
    const message =
      typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody
        ? String((errorBody as Record<string, unknown>).message)
        : `Request failed: ${res.status}`;
    throw new ApiError(res.status, message, errorBody);
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6);
        let parsed: { chunk?: string; done?: boolean; error?: string };
        try {
          parsed = JSON.parse(jsonStr) as typeof parsed;
        } catch {
          continue; // Ignore only malformed/non-JSON SSE frames.
        }
        if (parsed.error) throw new ApiError(502, parsed.error, parsed);
        if (parsed.chunk) onChunk(parsed.chunk);
      }
    }
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  /** GET and validate the response against a Zod schema. */
  getValidated: <T>(path: string, schema: ZodSchema<T>, options?: RequestOptions) =>
    request<unknown>('GET', path, undefined, options).then((data) => validateResponse(data, schema)),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  stream: streamPost,
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};

/**
 * Wrap an API response with Zod validation.
 * Throws an ApiError with status 500 if validation fails.
 */
export function validateResponse<T>(data: unknown, schema: ZodSchema<T>): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('API response validation failed:', result.error.format());
    throw new ApiError(500, `Response validation failed: ${result.error.issues.length} issue(s)`);
  }
  return result.data;
}
