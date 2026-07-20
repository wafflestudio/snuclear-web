const BASE_URL =
  import.meta.env.VITE_API_URL || 'https://snuclear-server.wafflestudio.com/';

const TOKEN_KEY = 'authToken';

// Memory cache initialized from sessionStorage (handles page refresh)
let cachedToken: string | null = sessionStorage.getItem(TOKEN_KEY);

export function setAuthToken(token: string | null): void {
  cachedToken = token;
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return cachedToken;
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(data?.message as string ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

type RequestOptions = {
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
};

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (cachedToken) {
    headers['Authorization'] = `Bearer ${cachedToken}`;
  }

  const hasBody = options?.data !== undefined;

  const response = await fetch(buildUrl(path, options?.params), {
    method,
    headers,
    body: hasBody ? JSON.stringify(options!.data) : undefined,
  });

  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // response body not JSON
    }
    throw new ApiError(response.status, errorData);
  }

  let data: T;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = undefined as T;
  }

  return { data, status: response.status };
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('GET', path, options);
  },
  post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('POST', path, { ...options, data });
  },
  patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('PATCH', path, { ...options, data });
  },
  put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('PUT', path, { ...options, data });
  },
  delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return request<T>('DELETE', path, options);
  },
};
