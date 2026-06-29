// Typed fetch wrappers for the Cortex server API.
// All requests include credentials so the httpOnly JWT cookie is sent.

export interface Me {
  id: number;
  github_login: string;
  vault_inbox_path: string | null;
}

export interface Settings {
  vaultInboxPath: string | null;
}

export type CaptureType = 'thought' | 'task' | 'link' | 'calendar';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string; code?: string };
      if (body.error) message = body.error;
      code = body.code;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  /** Returns the current user, or throws ApiError(401) if not authenticated. */
  me: () => request<Me>('/api/me'),

  getSettings: () => request<Settings>('/api/settings'),

  updateSettings: (vaultInboxPath: string) =>
    request<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ vaultInboxPath }),
    }),

  createCapture: (content: string, type: CaptureType) =>
    request<{ ok: true; filepath: string }>('/api/capture', {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    }),
};

/** Full-page redirect into the server-side GitHub OAuth flow. */
export function loginWithGitHub(): void {
  window.location.href = '/auth/github';
}
