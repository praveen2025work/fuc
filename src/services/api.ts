import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '@/config/api';
import { 
  ApiResponse, 
  HealthData, 
  UploadData, 
  FileUpload, 
  ShareRequest, 
  UploadFilters,
  User 
} from '@/types/api';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 30000,
});

// Create separate instance for user API
const userApi = axios.create({
  baseURL: API_CONFIG.userApiURL,
  timeout: 10000,
  withCredentials: true, // For Windows authentication
});

// Add request interceptor to include X-User-Id header
api.interceptors.request.use((config) => {
  const userData = localStorage.getItem('fileUploadUser');
  if (userData) {
    const user = JSON.parse(userData);
    config.headers['X-User-Id'] = user.userName;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Clear user data on 401
      localStorage.removeItem('fileUploadUser');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Get current user (Windows authentication)
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await userApi.get(
      API_CONFIG.endpoints.user
    );
    return response.data;
  },

  // Health check
  async checkHealth(): Promise<ApiResponse<HealthData>> {
    const response: AxiosResponse<ApiResponse<HealthData>> = await api.get(
      API_CONFIG.endpoints.health
    );
    return response.data;
  },

  // Upload file
  async uploadFile(file: File, fileLocation: string): Promise<ApiResponse<UploadData>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_location', fileLocation);

    const response: AxiosResponse<ApiResponse<UploadData>> = await api.post(
      API_CONFIG.endpoints.upload,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Get uploads
  async getUploads(filters?: UploadFilters): Promise<ApiResponse<FileUpload[]>> {
    const params = new URLSearchParams();
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);
    if (filters?.search) params.append('search', filters.search);

    const response: AxiosResponse<ApiResponse<FileUpload[]>> = await api.get(
      `${API_CONFIG.endpoints.uploads}?${params.toString()}`
    );
    return response.data;
  },

  // Share file
  async shareFile(uploadId: number, shareRequest: ShareRequest): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `${API_CONFIG.endpoints.share}/${uploadId}`,
      shareRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Download file
  async downloadFile(uploadId: number): Promise<Blob> {
    const response: AxiosResponse<Blob> = await api.get(
      `${API_CONFIG.endpoints.download}/${uploadId}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};