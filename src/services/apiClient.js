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

  const { timeoutMs = path.startsWith('/auth/') ? 30000 : 0, signal, ...requestOptions } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(signal.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timer = timeoutMs > 0 ? setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs) : null;
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...requestOptions,
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      const body = await response.text();
      let message = body;
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed.detail === 'string') message = parsed.detail;
      } catch { /* Keep text responses from proxies readable. */ }
      const error = new Error(message || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error('The sign-in service took too long to respond. Please try again. If this continues, contact your administrator.');
      timeoutError.code = 'REQUEST_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timer !== null) clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export const getJson = (path) => apiRequest(path);
export const postJson = (path, data) => apiRequest(path, { method: 'POST', body: JSON.stringify(data) });
export const patchJson = (path, data) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(data) });
