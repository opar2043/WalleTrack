/**
 * HTTP client.
 *
 * One axios instance owns auth, timeouts, JSON parsing and error shaping for
 * the whole app. There are no refresh tokens: a `401` means the session is
 * gone, so the token is wiped and the auth store broadcasts a sign-out.
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { clearSession, hydrateSession, peekToken } from './storage';

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

function resolveBaseUrl(): string {
  const fromExpo = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExpo) return fromExpo.replace(/\/$/, '');

  // `adb reverse tcp:4000 tcp:4000` maps a physical device's localhost to the
  // dev machine, so the same default works on simulators and handsets alike.
  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://localhost:4000/api/v1'
      : 'http://localhost:4000/api/v1';
  }

  return 'https://api.walletrack.app/api/v1';
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors: { path: string; message: string }[];

  constructor(
    message: string,
    status: number,
    errors: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** Field-level message for inline form errors. */
  fieldError(path: string): string | undefined {
    return this.errors.find((error) => error.path === path)?.message;
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use(async (incoming: InternalAxiosRequestConfig) => {
  const config = incoming as ExtendedAxiosRequestConfig;
  if (config.skipAuth) return config;
  await hydrateSession();
  const token = peekToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Client-Platform'] = Platform.OS;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status ?? 0;

    const requestConfig = error.config as ExtendedAxiosRequestConfig | undefined;
    if (status === 401 && !requestConfig?.skipAuth) {
      await clearSession();
      onUnauthorized?.();
    }

    const body = error.response?.data as
      | { message?: string; errors?: { path: string; message: string }[] }
      | undefined;

    let message = body?.message ?? error.message ?? 'Something went wrong.';
    if (!error.response) {
      message =
        error.code === 'ECONNABORTED'
          ? 'The request timed out. Check your connection and try again.'
          : 'Cannot reach Walletrack. Check your connection and try again.';
    }

    return Promise.reject(new ApiError(message, status, body?.errors ?? []));
  },
);

type ExtendedAxiosRequestConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean;
};

type RequestOptions = {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export const api = {
  get: <T>(url: string, options: RequestOptions = {}) =>
    http.get<{ data: T }>(url, options).then(unwrap<T>),

  post: <T>(url: string, body?: unknown, options: RequestOptions = {}) =>
    http.post<{ data: T }>(url, body, options).then(unwrap<T>),

  patch: <T>(url: string, body?: unknown, options: RequestOptions = {}) =>
    http.patch<{ data: T }>(url, body, options).then(unwrap<T>),

  put: <T>(url: string, body?: unknown, options: RequestOptions = {}) =>
    http.put<{ data: T }>(url, body, options).then(unwrap<T>),

  delete: <T>(url: string, options: RequestOptions = {}) =>
    http.delete<{ data: T }>(url, options).then(unwrap<T>),
};
