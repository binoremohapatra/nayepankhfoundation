/**
 * apiService.ts
 * Centralized Axios instance for all Volunteer Hub API calls.
 * Base URL: http://localhost:8080 (or proxied via /api)
 */

import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://nayepankhfoundation-dl7u.onrender.com';

export interface Volunteer {
  id?: number;
  name: string;
  email: string;
  phone: string;
  skills: string;
  availability: string;
  comments?: string;
  status?: string;
  isEmailVerified?: boolean;
  registeredAt?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  skills: string;
  otp: string;
  availability?: string;
  comments?: string;
}

export interface DashboardMetrics {
  totalApplications: number;
  activeVolunteers: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request Interceptor: Attach X-Correlation-ID tracking header
api.interceptors.request.use(
  (config) => {
    let correlationId = config.headers['X-Correlation-ID'];
    if (!correlationId) {
      correlationId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      config.headers['X-Correlation-ID'] = correlationId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to extract nested validation errors or general messages
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data;
    if (error.response?.status === 422 && errorData?.data) {
      // Return details of invalid fields as a string representation of key-values
      return Object.entries(errorData.data)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
    }
    return errorData?.message || error.message || 'Network error. Is the backend running?';
  }
  return 'An unexpected error occurred.';
}

export const volunteerApi = {
  /** POST /api/volunteers/generate-otp — request verification OTP */
  generateOtp: async (email: string): Promise<void> => {
    try {
      await api.post<ApiResponse<void>>('/api/volunteers/generate-otp', { email });
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  /** POST /api/volunteers/register — verify OTP and register volunteer */
  register: async (request: RegisterRequest): Promise<Volunteer> => {
    try {
      const { data } = await api.post<ApiResponse<Volunteer>>('/api/volunteers/register', request);
      return data.data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  /** POST /api/volunteers — legacy direct register */
  registerDirect: async (volunteer: Omit<Volunteer, 'id' | 'status' | 'registeredAt'>): Promise<Volunteer> => {
    try {
      const { data } = await api.post<ApiResponse<Volunteer>>('/api/volunteers', volunteer);
      return data.data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  /** GET /api/volunteers — fetch all volunteers */
  getAll: async (): Promise<Volunteer[]> => {
    try {
      const { data } = await api.get<ApiResponse<Volunteer[]>>('/api/volunteers');
      return data.data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  /** PUT /api/volunteers/{id}/status — update volunteer status */
  updateStatus: async (id: number, status: string): Promise<Volunteer> => {
    try {
      const { data } = await api.put<ApiResponse<Volunteer>>(`/api/volunteers/${id}/status`, null, {
        params: { status },
      });
      return data.data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  /** DELETE /api/volunteers/{id} — remove a volunteer */
  remove: async (id: number): Promise<void> => {
    try {
      await api.delete<ApiResponse<void>>(`/api/volunteers/${id}`);
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },

  /** GET /api/volunteers/metrics — get dashboard metrics */
  getMetrics: async (): Promise<DashboardMetrics> => {
    try {
      const { data } = await api.get<ApiResponse<DashboardMetrics>>('/api/volunteers/metrics');
      return data.data;
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  },
};
