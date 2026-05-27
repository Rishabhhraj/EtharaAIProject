const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('token');

const handleUnauthorized = () => {
  localStorage.removeItem('token');
  const path = window.location.pathname;
  if (!path.startsWith('/login') && !path.startsWith('/signup')) {
    const params = new URLSearchParams({ session: 'expired' });
    window.location.href = `/login?${params.toString()}`;
  }
};

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const isAuthRoute = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');
    if (!isAuthRoute) {
      handleUnauthorized();
    }
    const msg = data.message || 'Session expired. Please log in again.';
    throw new Error(msg);
  }

  if (!res.ok) {
    const msg = data.message || data.errors?.[0]?.message || 'Request failed';
    throw new Error(msg);
  }

  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  getProfile: () => request('/auth/profile'),

  getDashboard: () => request('/dashboard'),
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id, body) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  addMembers: (id, memberIds) =>
    request(`/projects/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberIds }),
    }),
  removeMember: (projectId, memberId) =>
    request(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),

  getTasks: (projectId) => request(`/tasks/project/${projectId}`),
  createTask: (projectId, body) =>
    request(`/tasks/project/${projectId}`, { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) =>
    request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  getPendingStatusRequests: (projectId) =>
    request(`/status-requests/project/${projectId}/pending`),
  getMyStatusRequests: (projectId) => request(`/status-requests/project/${projectId}`),
  submitStatusRequest: (taskId, requestedStatus) =>
    request(`/status-requests/task/${taskId}`, {
      method: 'POST',
      body: JSON.stringify({ requestedStatus }),
    }),
  approveStatusRequest: (id) =>
    request(`/status-requests/${id}/approve`, { method: 'PATCH' }),
  rejectStatusRequest: (id, reviewNote) =>
    request(`/status-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewNote }),
    }),

  getMembers: () => request('/users/members'),

  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  getTaskComments: (taskId) => request(`/comments/task/${taskId}`),
  addTaskComment: (taskId, text) =>
    request(`/comments/task/${taskId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};
