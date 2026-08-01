const API_BASE = import.meta.env.VITE_API_URL || 'https://api.qrdobem.com.br/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('firebase_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error || `Erro ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// --- Auth ---
export const authApi = {
  sendOtp: (email, firebase_uid) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, firebase_uid }),
    }),

  verifyOtp: (firebase_uid, code) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ firebase_uid, code }),
    }),

  me: () => request('/auth/me'),
};

// --- Entities ---
export const entitiesApi = {
  list: (organizationId) =>
    request(`/entities${organizationId ? `?organization_id=${organizationId}` : ''}`),

  create: (data) =>
    request('/entities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  show: (uniqueCode) => request(`/entities/${uniqueCode}`),

  // A API gera o QR (é whitelabel). Precisa passar pelo request() por causa
  // do Bearer token — usar a URL direto num <img src> daria 401.
  qrCode: (uniqueCode) => request(`/entities/${uniqueCode}/qrcode`),
};

// --- Perfil (coleta progressiva) ---
export const profileApi = {
  get: () => request('/profile'),

  update: (data) =>
    request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addDocument: (data) =>
    request('/profile/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Admin ---
export const adminApi = {
  getTenants: () => request('/admin/tenants'),


  createBatch: (data) =>
    request('/admin/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleBatch: (batchId) =>
    request(`/admin/batches/${batchId}/toggle`, { method: 'POST' }),
};

// --- Messages ---
export const messagesApi = {
  list: () => request('/messages'),

  markAsRead: (id) =>
    request(`/messages/${id}/read`, { method: 'POST' }),

  sendPublic: (uniqueCode, data) =>
    request(`/entities/${uniqueCode}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
