# File Upload Center UI

A beautiful, modern React-based web application for secure file upload and management. Built with Next.js, TypeScript, and Tailwind CSS, featuring enterprise-grade security and seamless user experience.

## Features

- 🔐 **Secure Authentication**: External authentication simulation with user management
- 📁 **File Upload**: Drag-and-drop file upload with progress tracking
- 📋 **File Management**: List, search, filter, and download files
- 🤝 **File Sharing**: Share files with other users
- 🏥 **Health Monitoring**: Server health check and status monitoring
- 🎨 **Beautiful UI**: Modern design with smooth animations using Framer Motion
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- 🌙 **Theme Support**: Light and dark mode support

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Notifications**: Sonner toast notifications
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, yarn, or pnpm package manager
- File Upload Center API running on `http://localhost:3000`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd file-upload-center-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   
   The `.env.local` file is already configured with default values:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NODE_ENV=development
   ```
   
   Update `NEXT_PUBLIC_API_URL` if your API runs on a different URL.

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3001` to access the application.

## API Integration

The application integrates with the File Upload Center API with the following endpoints:

- `GET /api/health` - Server health check
- `POST /api/upload` - Upload files
- `GET /api/uploads` - List user files
- `POST /api/share/{id}` - Share files
- `GET /api/download/{id}` - Download files

### Authentication

The application uses simulated external authentication. Users need to provide:
- **User ID**: Unique identifier
- **Display Name**: Full name for display
- **Employee ID**: Employee identifier

All API requests include the `X-User-Id` header for authentication.

### CORS Configuration

Ensure your API allows requests from `http://localhost:3001`. The API should include this origin in its `ALLOWED_ORIGINS` configuration.

## File Upload Specifications

- **Supported formats**: `.png`, `.jpg`, `.jpeg`, `.pdf`
- **Maximum file size**: 100MB
- **Default location**: `C:\shared_dev` (configurable)
- **Upload method**: Multipart form data with drag-and-drop support

## Usage Guide

### 1. Authentication
- Enter your User ID, Display Name, and Employee ID
- Click "Sign In" to access the application

### 2. Upload Files
- Navigate to the "Upload" tab
- Drag and drop files or click to browse
- Specify the file location path
- Click "Upload File" to start the upload

### 3. Manage Files
- Navigate to the "Files" tab
- Use filters to search by date range or filename
- Download files by clicking the download button
- Share files by clicking the share button and entering a user ID

### 4. Monitor Health
- Navigate to the "Health" tab
- Click "Check Server Status" to verify API connectivity
- View server status, debug mode, and configuration details

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── AuthForm.tsx    # Authentication form
│   ├── UploadForm.tsx  # File upload component
│   ├── FileList.tsx    # File management table
│   ├── HealthCheck.tsx # Server health monitoring
│   └── Header.tsx      # Application header
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── services/           # API services
│   └── api.ts          # API client and methods
├── types/              # TypeScript type definitions
│   └── api.ts          # API response types
├── config/             # Configuration files
│   └── api.ts          # API configuration
├── pages/              # Next.js pages
│   ├── _app.tsx        # App wrapper with providers
│   └── index.tsx       # Main application page
└── styles/             # Global styles
    └── globals.css     # Tailwind CSS and custom styles
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Customization

#### API Configuration
Update `src/config/api.ts` to modify:
- API base URL
- Endpoint paths
- File type restrictions
- File size limits
- Default file location

#### Styling
The application uses a custom design system based on the primary color `#2a73b2`. Modify `src/styles/globals.css` to customize:
- Color scheme
- Border radius
- Typography
- Component styles

#### Components
All components are built with TypeScript and follow React best practices:
- Functional components with hooks
- Proper error handling
- Loading states
- Responsive design
- Accessibility features

## Deployment

### Development Deployment
The application is configured to run on `http://localhost:3001` to match CORS settings.

### Production Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t file-upload-center-ui .
docker run -p 3001:3001 file-upload-center-ui
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure the API allows `http://localhost:3001` in ALLOWED_ORIGINS
   - Check that the API is running on the correct port

2. **Authentication Issues**
   - Verify the `X-User-Id` header is being sent
   - Check that user data is stored in localStorage

3. **File Upload Failures**
   - Verify file type and size restrictions
   - Check API endpoint availability
   - Ensure proper form data formatting

4. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` in `.env.local`
   - Check API server status
   - Review network connectivity

### Debug Mode
Enable debug logging by checking the browser console for:
- API request/response logs
- Authentication state changes
- File upload progress
- Error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Check browser console for errors
- Verify API server status

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS