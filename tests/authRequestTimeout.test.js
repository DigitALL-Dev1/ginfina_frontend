import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../src/services/apiClient';

describe('authentication request deadlines', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    vi.stubGlobal('localStorage', { getItem: () => null });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('aborts a stalled sign-in after 30 seconds with a retry message', async () => {
    const fetch = vi.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetch);
    const pending = apiRequest('/auth/login', { method: 'POST', body: '{}' });
    const check = expect(pending).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT', message: expect.stringContaining('Please try again') });
    await vi.advanceTimersByTimeAsync(30000);
    await check;
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the deadline active while waiting for the response body', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, { signal }) => ({ ok: true, status: 200,
      json: () => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))),
    })));
    const check = expect(apiRequest('/auth/verify-mfa')).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(30000);
    await check;
  });

  it('preserves provider errors and clears the timer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, text: async () => JSON.stringify({ detail: 'Email delivery timed out.' }) })));
    await expect(apiRequest('/auth/login')).rejects.toMatchObject({ status: 503, message: 'Email delivery timed out.' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns successful verification without a later timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ role: 'REVIEWER' }) })));
    await expect(apiRequest('/auth/verify-mfa')).resolves.toEqual({ role: 'REVIEWER' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
