/**
 * API client for communicating with FastAPI backend.
 * Uses NEXT_PUBLIC_API_URL environment variable (must start with NEXT_PUBLIC_ to be exposed to client).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Fetch wrapper for FastAPI backend API calls.
 * Automatically includes JSON headers and handles CORS credentials.
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T | null> {
  const { headers = {}, ...restOptions } = options;

  const response = await fetch(`${API_URL}${url}`, {
    ...restOptions,
    credentials: 'include', // Send cookies for session-based auth
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  // Handle empty responses (like from DELETE requests)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

/**
 * Convenience API object with common HTTP methods.
 * Each method calls apiRequest with the appropriate HTTP verb.
 */
export const api = {
  get: <T = unknown>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T = unknown>(url: string, data?: unknown) =>
    apiRequest<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T = unknown>(url: string, data?: unknown) =>
    apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T = unknown>(url: string, data?: unknown) =>
    apiRequest<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T = unknown>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};
