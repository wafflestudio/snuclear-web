import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://snuclear-server.wafflestudio.com/',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.request.use((config) => {
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});
