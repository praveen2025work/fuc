export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  userApiURL: process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:9521',
  environment: process.env.NEXT_PUBLIC_ENV || 'local',
  endpoints: {
    health: '/health',
    config: '/config',
    applications: '/applications',
    applicationLocations: (applicationId: number) => `/applications/${applicationId}/locations`,
    upload: '/upload',
    share: (uploadId: number) => `/share/${uploadId}`,
    uploads: '/uploads',
    download: (filename: string) => `/download/${encodeURIComponent(filename)}`,
    userinfo: (userid: string) => `/userinfo/${userid}`,
  },
  allowedFileTypes: ['*'], // Allow all file types - will be overridden by config endpoint
  maxFileSize: 100 * 1024 * 1024, // 100MB
  defaultFileLocation: 'C:\\shared_dev',
};

export const CORS_CONFIG = {
  allowedOrigin: 'http://localhost:3001',
};