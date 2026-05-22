import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
];

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
  console.warn('VITE_API_URL no está configurada. Se usará /api/v1 como fallback.');
}

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const isPublicEndpoint = (url?: string) =>
  PUBLIC_ENDPOINTS.some((endpoint) => url?.includes(endpoint));

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('business_id');
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const flushRefreshQueue = (error: unknown, token?: string) => {
  refreshQueue.forEach((item) => {
    if (error) {
      item.reject(error);
      return;
    }

    if (token) {
      item.resolve(token);
    }
  });

  refreshQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const headers = (config.headers ?? {}) as Record<string, string>;

    if (!isPublicEndpoint(config.url)) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const businessId = localStorage.getItem('business_id');
    if (businessId) {
      headers['X-Tenant-ID'] = businessId;
    }

    config.headers = headers as InternalAxiosRequestConfig['headers'];
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const shouldSkipRefresh =
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isPublicEndpoint(originalRequest.url) ||
      originalRequest.url?.includes('/auth/refresh');

    if (shouldSkipRefresh) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      clearSession();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        const headers = (originalRequest.headers ?? {}) as Record<string, string>;
        headers.Authorization = `Bearer ${token}`;
        originalRequest.headers = headers as InternalAxiosRequestConfig['headers'];
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await publicApi.post<{ access_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const accessToken = response.data.access_token;
      localStorage.setItem('access_token', accessToken);

      flushRefreshQueue(null, accessToken);

      const headers = (originalRequest.headers ?? {}) as Record<string, string>;
      headers.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers = headers as InternalAxiosRequestConfig['headers'];

      return apiClient(originalRequest);
    } catch (refreshError) {
      flushRefreshQueue(refreshError);
      clearSession();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const api = apiClient;
export default apiClient;
