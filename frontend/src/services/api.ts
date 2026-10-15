import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { User, Project, PipelineAsset, PipelineSegment, EvidenceRecord, Measurement, AIObservation, RouteComparison, ReviewHistory, ExtractedFrame } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      // window.location.href = '/login'; // disabled
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; token_type: string }>('/auth/login',
      new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ),
  register: (data: { email: string; password: string; full_name?: string; role?: User['role'] }) =>
    api.post<User>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
  updateProfile: (data: { full_name: string }) => api.patch<User>('/auth/me', data),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/auth/change-password', { current_password, new_password }),
};

export const projectsApi = {
  list: (params?: { skip?: number; limit?: number; status?: Project['status'] }) =>
    api.get<Project[]>('/projects', { params }),
  get: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: Omit<Project, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) =>
    api.post<Project>('/projects', data),
  update: (id: number, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

export const assetsApi = {
  list: (projectId: number) => api.get<PipelineAsset[]>(`/projects/${projectId}/assets`),
  get: (id: number) => api.get<PipelineAsset>(`/assets/${id}`),
  create: (projectId: number, data: Omit<PipelineAsset, 'id' | 'project_id' | 'created_at' | 'updated_at'>) =>
    api.post<PipelineAsset>(`/projects/${projectId}/assets`, data),
  update: (id: number, data: Partial<PipelineAsset>) =>
    api.patch<PipelineAsset>(`/assets/${id}`, data),
  delete: (id: number) => api.delete(`/assets/${id}`),
};

export const segmentsApi = {
  list: (assetId: number) => api.get<PipelineSegment[]>(`/assets/${assetId}/segments`),
  get: (id: number) => api.get<PipelineSegment>(`/segments/${id}`),
  create: (assetId: number, data: Omit<PipelineSegment, 'id' | 'asset_id' | 'created_at' | 'updated_at'>) =>
    api.post<PipelineSegment>(`/assets/${assetId}/segments`, data),
  update: (id: number, data: Partial<PipelineSegment>) =>
    api.patch<PipelineSegment>(`/segments/${id}`, data),
  delete: (id: number) => api.delete(`/segments/${id}`),
};

export const evidenceApi = {
  list: (projectId: number) => api.get<EvidenceRecord[]>(`/projects/${projectId}/evidence`),
  get: (id: number) => api.get<EvidenceRecord>(`/evidence/${id}`),
  create: (data: Omit<EvidenceRecord, 'id' | 'server_timestamp' | 'created_at' | 'updated_at'>) =>
    api.post<EvidenceRecord>('/evidence', data),
  delete: (id: number) => api.delete(`/evidence/${id}`),
  getFrames: (evidenceId: number) => api.get<ExtractedFrame[]>(`/evidence/${evidenceId}/frames`),
};

export const measurementsApi = {
  list: (segmentId: number) => api.get<Measurement[]>(`/segments/${segmentId}/measurements`),
  create: (segmentId: number, data: Omit<Measurement, 'id' | 'segment_id' | 'created_at' | 'updated_at'>) =>
    api.post<Measurement>(`/segments/${segmentId}/measurements`, data),
  update: (id: number, data: Partial<Measurement>) =>
    api.patch<Measurement>(`/measurements/${id}`, data),
  delete: (id: number) => api.delete(`/measurements/${id}`),
};

export const aiApi = {
  listObservations: (segmentId: number) => api.get<AIObservation[]>(`/segments/${segmentId}/ai-observations`),
  createObservation: (segmentId: number, data: Omit<AIObservation, 'id' | 'segment_id' | 'created_at' | 'updated_at'>) =>
    api.post<AIObservation>(`/segments/${segmentId}/ai-observations`, data),
  updateObservation: (id: number, data: Partial<AIObservation>) =>
    api.patch<AIObservation>(`/ai-observations/${id}`, data),
};

export const comparisonsApi = {
  get: (segmentId: number) => api.get<RouteComparison>(`/segments/${segmentId}/comparison`),
  create: (segmentId: number, data: { tolerance_m?: number }) =>
    api.post<RouteComparison>(`/segments/${segmentId}/comparison`, data),
};

export const reviewsApi = {
  list: (segmentId: number) => api.get<ReviewHistory[]>(`/segments/${segmentId}/reviews`),
  create: (segmentId: number, data: Omit<ReviewHistory, 'id' | 'segment_id' | 'user_id' | 'created_at'>) =>
    api.post<ReviewHistory>(`/segments/${segmentId}/reviews`, data),
};

export const healthApi = {
  check: () => api.get<{ status: string; app_name: string; version: string; database: string }>('/health'),
};

export default api;