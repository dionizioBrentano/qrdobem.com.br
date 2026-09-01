import { firebaseRefreshToken, firebaseLogout } from './firebase';

export const API_BASE = import.meta.env.VITE_API_URL || 'https://api.qrdobem.com.br/api';

export let reauthHandler = null;
export const setReauthHandler = (handler) => { reauthHandler = handler; };

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('firebase_token');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  Object.keys(headers).forEach((key) => {
    if (headers[key] === undefined) delete headers[key];
  });

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token && !options._isRetry && !options._noReauth) {
      const refreshed = await firebaseRefreshToken();

      if (refreshed) {
        return request(endpoint, { ...options, _isRetry: true });
      }

      firebaseLogout();
      window.location.href = '/login?expired=true';
      return new Promise(() => {});
    }

    const error = new Error(data?.error || `Erro ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}