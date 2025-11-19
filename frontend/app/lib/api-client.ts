const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include', // This is critical - includes cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  // Handle empty responses (like from DELETE)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

export const api = {
  get: (url: string) => apiRequest(url, { method: 'GET' }),
  post: (url: string, data?: any) => apiRequest(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data?: any) => apiRequest(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string) => apiRequest(url, { method: 'DELETE' }),
};
