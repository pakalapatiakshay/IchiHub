const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000';
const TOKEN_KEY = 'ichihub.access-token';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function getAccessToken() { return localStorage.getItem(TOKEN_KEY); }
export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error || 'Something went wrong', response.status);
  return body as T;
}

export function openEventStream() {
  const token = getAccessToken();
  return token ? new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`) : null;
}
