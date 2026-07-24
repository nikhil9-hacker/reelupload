/**
 * Shared API client with session ID injection and error handling.
 */

const getSessionId = (): string => {
  let id = sessionStorage.getItem('reelpilot_session_id');
  if (!id) {
    id = 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('reelpilot_session_id', id);
  }
  return id;
};

export const api = {
  get: (url: string) => fetchWithSession(url, { method: 'GET' }),
  post: (url: string, body?: any) => fetchWithSession(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }),
  delete: (url: string) => fetchWithSession(url, { method: 'DELETE' }),
};

async function fetchWithSession(url: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  headers.set('x-session-id', getSessionId());

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMessage = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(errorMessage);
  }

  return data?.data !== undefined ? data.data : data;
}

export { getSessionId };

export function fetchWithSessionRaw(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  headers.set('x-session-id', getSessionId());
  return fetch(url, { ...options, headers });
}
