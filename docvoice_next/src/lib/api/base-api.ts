import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError } from './api-error';
import { showSuccess } from '@/lib/notification.service';
import type { ApiResponse, ApiRequestOptions } from './types';
import { authCookies } from '@/lib/auth-cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const DEFAULT_TIMEOUT = 30000;
const AUTH_TOKEN_KEY = 'auth_token';

const createAxiosInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
};

const instance = createAxiosInstance();

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRedirectingToLogin = false;

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const apiError = ApiError.fromAxiosError(error);
    suppressErrorStack(apiError);

    if (apiError.isUnauthorized() && typeof window !== 'undefined') {
      if (!isRedirectingToLogin && !window.location.pathname.includes('/login')) {
        isRedirectingToLogin = true;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(apiError);
  }
);

const suppressErrorStack = (error: Error) => {
  try {
    error.stack = '';
  } catch (e) {}
  return error;
};

const extractData = <T>(response: ApiResponse<T>, showMessage: boolean = false): T => {
  if (response.status === false) {
    const apiError = new ApiError(response.code, response.message, response.errors || {});
    suppressErrorStack(apiError);
    throw apiError;
  }
  if (showMessage && response.message) {
    showSuccess(response.message);
  }
  return response.payload as T;
};

const baseApi = {
  async get<T = any>(url: string, options?: ApiRequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    };

    const response = await instance.get<ApiResponse<T>>(url, config);
    return extractData(response.data);
  },

  async post<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: {
        ...options?.headers,
      },
      signal: options?.signal,
      timeout: options?.timeout,
    };

    if (data instanceof FormData) {
      config.headers = {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      };
    }

    const response = await instance.post<ApiResponse<T>>(url, data, config);
    return extractData(response.data, true);
  },

  async put<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    };

    const response = await instance.put<ApiResponse<T>>(url, data, config);
    return extractData(response.data, true);
  },

  async patch<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    };

    const response = await instance.patch<ApiResponse<T>>(url, data, config);
    return extractData(response.data, true);
  },

  async delete<T = any>(url: string, options?: ApiRequestOptions): Promise<T> {
    const config: AxiosRequestConfig = {
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
      timeout: options?.timeout,
    };

    const response = await instance.delete<ApiResponse<T>>(url, config);
    return extractData(response.data, true);
  },

  getAxiosInstance(): AxiosInstance {
    return instance;
  },

  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      authCookies.setToken(token);
    }
  },

  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      authCookies.clearAll();
    }
  },

  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  async getCsrfToken(): Promise<void> {
    const csrfUrl = API_BASE_URL.replace('/api/v1', '') + '/sanctum/csrf-cookie';
    await axios.get(csrfUrl, { withCredentials: true });
  },
};

export { baseApi };
export default baseApi;
