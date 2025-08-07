export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  userApiURL: process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:9521',
  environment: process.env.NEXT_PUBLIC_ENV || 'local',
  endpoints: {
    user: '/api/user',
    health: '/api/health',
    upload: '/api/upload',
    share: '/api/share',
    uploads: '/api/uploads',
    download: '/api/download',
  },
  allowedFileTypes: ['.png', '.jpg', '.jpeg', '.pdf'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  defaultFileLocation: 'C:\\shared_dev',
};

export const CORS_CONFIG = {
  allowedOrigin: 'http://localhost:3001',
};