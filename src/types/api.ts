export interface User {
  user_id: string;
  display_name: string;
  employee_id: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface HealthData {
  server: string;
  debug_mode: boolean;
}

export interface UploadData {
  upload_id: number;
  filename: string;
  size: number;
  upload_time: string;
  file_location: string;
}

export interface FileUpload {
  id: number;
  filename: string;
  size: number;
  upload_time: string;
  user_id: string;
  file_location: string;
  download_count: number;
}

export interface ShareRequest {
  shared_with: string;
}

export interface UploadFilters {
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface ApiError {
  status: 'error';
  message: string;
}