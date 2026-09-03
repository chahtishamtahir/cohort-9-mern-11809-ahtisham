/**
 * Frontend API Service
 * Handles communication with the Node.js backend API
 */

const API_BASE = 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('notionflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication Endpoints
export const authApi = {
  signup: (name, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  getMe: () => request('/auth/me')
};

// Notes Endpoints
export const notesApi = {
  getAll: (search = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/notes${queryString}`);
  },

  getById: (id) => request(`/notes/${id}`),

  create: (noteData) =>
    request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    }),

  update: (id, noteData) =>
    request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData)
    }),

  delete: (id) =>
    request(`/notes/${id}`, {
      method: 'DELETE'
    }),

  exportAll: () => request('/notes/export/all'),

  importAll: (notes) =>
    request('/notes/import/all', {
      method: 'POST',
      body: JSON.stringify({ notes })
    })
};
