const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: (token?: string) =>
    apiRequest('/api/auth/user', { token }),
};

// Projects API
export const projectsApi = {
  getAll: (token?: string) =>
    apiRequest('/api/projects/', { token }),

  getById: (id: string, token?: string) =>
    apiRequest(`/api/projects/${id}`, { token }),

  create: (data: any, token?: string) =>
    apiRequest('/api/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: any, token?: string) =>
    apiRequest(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token?: string) =>
    apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// Tasks API
export const tasksApi = {
  getByProject: (projectId: string, token?: string) =>
    apiRequest(`/api/projects/${projectId}/tasks`, { token }),

  create: (projectId: string, data: any, token?: string) =>
    apiRequest(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: any, token?: string) =>
    apiRequest(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token?: string) =>
    apiRequest(`/api/tasks/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// Notes API
export const notesApi = {
  getByProject: (projectId: string, token?: string) =>
    apiRequest(`/api/projects/${projectId}/notes`, { token }),

  create: (projectId: string, data: any, token?: string) =>
    apiRequest(`/api/projects/${projectId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: any, token?: string) =>
    apiRequest(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token?: string) =>
    apiRequest(`/api/notes/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// AI API
export const aiApi = {
  extractTasks: (content: string, token?: string) =>
    apiRequest('/api/ai/extract-tasks', {
      method: 'POST',
      body: JSON.stringify({ content }),
      token,
    }),

  estimateTime: (taskDescription: string, token?: string) =>
    apiRequest('/api/ai/estimate-time', {
      method: 'POST',
      body: JSON.stringify({ taskDescription }),
      token,
    }),

  analyzePriority: (taskDescription: string, context?: string, token?: string) =>
    apiRequest('/api/ai/analyze-priority', {
      method: 'POST',
      body: JSON.stringify({ taskDescription, context }),
      token,
    }),
};

// Timer API
export const timerApi = {
  getActive: (token?: string) =>
    apiRequest('/api/timer/active', { token }),

  start: (taskId: string, token?: string) =>
    apiRequest(`/api/timer/start/${taskId}`, {
      method: 'POST',
      token,
    }),

  stop: (taskId: string, token?: string) =>
    apiRequest(`/api/timer/stop/${taskId}`, {
      method: 'POST',
      token,
    }),

  getEntries: (taskId: string, token?: string) =>
    apiRequest(`/api/timer/entries/${taskId}`, { token }),
};

// Reports API
export const reportsApi = {
  getTaskStats: (projectId?: string, token?: string) =>
    apiRequest(`/api/reports/tasks/stats${projectId ? `?project_id=${projectId}` : ''}`, { token }),

  getTimeStats: (projectId?: string, days: number = 7, token?: string) =>
    apiRequest(`/api/reports/time/stats?days=${days}${projectId ? `&project_id=${projectId}` : ''}`, { token }),

  getProductivityReport: (days: number = 30, token?: string) =>
    apiRequest(`/api/reports/productivity?days=${days}`, { token }),
};

// Workspaces API
export const workspacesApi = {
  getAll: (token?: string) =>
    apiRequest('/api/workspaces/', { token }),

  getById: (id: string, token?: string) =>
    apiRequest(`/api/workspaces/${id}`, { token }),

  create: (data: any, token?: string) =>
    apiRequest('/api/workspaces/', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: any, token?: string) =>
    apiRequest(`/api/workspaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  getMembers: (id: string, token?: string) =>
    apiRequest(`/api/workspaces/${id}/members`, { token }),
};
