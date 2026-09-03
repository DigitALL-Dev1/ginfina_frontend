const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiRequest(path, options = {}) {
  if (import.meta.env.VITE_DEMO_MODE !== 'false') {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return { ok: true, demo: true, path, method: options.method || 'GET', data: options.body ? JSON.parse(options.body) : null };
  }

  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
}

export const getJson = (path) => apiRequest(path);
export const postJson = (path, data) => apiRequest(path, { method: 'POST', body: JSON.stringify(data) });
export const patchJson = (path, data) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(data) });
