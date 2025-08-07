# File Upload Center

A comprehensive File Upload Center UI built with Next.js, TypeScript, Tailwind CSS, Radix UI, and Framer Motion, designed to interact with a File Upload Center API using Windows Authentication.

## Features

- **Windows Authentication**: Automatic authentication using Windows credentials
- **File Upload**: Drag-and-drop file upload with progress tracking
- **File Management**: List, filter, download, and share uploaded files
- **User Profile**: Detailed user information with photo support
- **Multi-Environment Support**: Local, Development, UAT, and Production configurations
- **IIS Deployment**: Ready for deployment on IIS servers
- **Responsive Design**: Mobile-friendly interface with smooth animations

## Prerequisites

- Node.js 20.x or higher
- npm or pnpm package manager
- IIS (for production deployment)

## Environment Configuration

The application supports multiple environments with separate configuration files:

### Environment Files

- `.env.local` - Local development
- `.env.dev` - Development environment
- `.env.uat` - UAT environment
- `.env.prod` - Production environment

### Environment Variables

Each environment file contains the following variables:

```env
NEXT_PUBLIC_ENV=<environment>
NEXT_PUBLIC_USER_API_URL=<user-api-url>
NEXT_PUBLIC_API_URL=<backend-api-url>
NEXT_PUBLIC_USER_PHOTO_URL=<user-photo-api-url>
```

#### Example Configuration

**Local Development (.env.local)**
```env
NEXT_PUBLIC_ENV=local
NEXT_PUBLIC_USER_API_URL=http://localhost:9521
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_USER_PHOTO_URL=http://localhost:9521
```

**Production (.env.prod)**
```env
NEXT_PUBLIC_ENV=prod
NEXT_PUBLIC_USER_API_URL=http://ldndsm:9521
NEXT_PUBLIC_API_URL=http://prod-api:3000
NEXT_PUBLIC_USER_PHOTO_URL=http://ldndsm:9521
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd file-upload-center
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

## Development

### Running Locally

Choose the appropriate environment and run:

```bash
# Local environment
npm run dev:local

# Development environment
npm run dev:dev

# UAT environment
npm run dev:uat

# Production environment
npm run dev:prod
```

The application will be available at `http://localhost:3001`

### Building for Different Environments

```bash
# Build for local
npm run build:local

# Build for development
npm run build:dev

# Build for UAT
npm run build:uat

# Build for production
npm run build:prod

# Build static files for IIS deployment
npm run build:static
```

## IIS Deployment

### Prerequisites for IIS

1. **IIS with URL Rewrite Module**: Install the URL Rewrite module from Microsoft
2. **Node.js**: Install Node.js on the IIS server
3. **iisnode**: Install iisnode for running Node.js applications on IIS

### Deployment Steps

#### Option 1: Static Export (Recommended for IIS)

1. **Build static files**:
```bash
npm run build:static
```

2. **Copy files to IIS**:
   - Copy the entire `out` folder contents to your IIS website directory
   - Example: `C:\inetpub\wwwroot\file-upload-center\`

3. **Configure IIS**:
   - Create a new website or virtual directory in IIS Manager
   - Point the physical path to your deployment folder
   - Ensure the application pool is set to "No Managed Code"

4. **Create web.config** (if not exists):
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
    <httpErrors errorMode="Custom" defaultResponseMode="File">
      <remove statusCode="404" />
      <error statusCode="404" path="/index.html" responseMode="File" />
    </httpErrors>
  </system.webServer>
</configuration>
```

#### Option 2: Node.js Application on IIS

1. **Build the application**:
```bash
npm run build:prod
```

2. **Copy files to IIS**:
   - Copy all project files to your IIS directory
   - Install dependencies on the server: `npm install --production`

3. **Create web.config**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <iisnode node_env="production" />
  </system.webServer>
</configuration>
```

4. **Create server.js**:
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

### IIS Configuration Notes

1. **Windows Authentication**: Ensure Windows Authentication is enabled in IIS for the application
2. **CORS**: Configure CORS settings if the APIs are on different domains
3. **SSL**: Configure SSL certificates for HTTPS in production
4. **Permissions**: Ensure IIS_IUSRS has appropriate permissions on the application folder

## API Integration

The application integrates with three main API endpoints:

### 1. User API
- **Endpoint**: `{NEXT_PUBLIC_USER_API_URL}/api/user`
- **Method**: GET
- **Authentication**: Windows Authentication
- **Purpose**: Retrieve current user information

### 2. Backend API
- **Base URL**: `{NEXT_PUBLIC_API_URL}`
- **Endpoints**:
  - `/api/health` - Health check
  - `/api/upload` - File upload
  - `/api/uploads` - List files
  - `/api/download/{id}` - Download file
  - `/api/share/{id}` - Share file
- **Authentication**: X-User-Id header

### 3. User Photo API
- **Endpoint**: `{NEXT_PUBLIC_USER_PHOTO_URL}/api/user/photo/{username}`
- **Method**: GET
- **Authentication**: Windows Authentication
- **Purpose**: Retrieve user profile photos

## User Interface Features

### User Profile Hover Card
- Click on the user name in the header to view detailed user information
- Displays user photo, contact details, department, and location
- Automatically fetches user photo from the photo API
- Falls back to generated avatar if photo is not available

### File Management
- Drag-and-drop file upload
- File filtering by date range and search
- Download and share functionality
- Real-time upload progress

### Health Monitoring
- Toggleable health status display
- API connectivity monitoring
- Environment information display

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Ensure Windows Authentication is enabled in IIS
   - Check that the user API endpoint is accessible
   - Verify CORS settings

2. **File Upload Issues**:
   - Check file size limits (default: 100MB)
   - Verify allowed file types configuration
   - Ensure backend API is accessible

3. **Static Export Issues**:
   - Use `npm run build:static` for IIS deployment
   - Ensure all images are properly optimized
   - Check that all API calls use absolute URLs

### Logs and Debugging

- Check browser console for client-side errors
- Monitor IIS logs for server-side issues
- Use the health check endpoint to verify API connectivity

## Development Guidelines

### Code Structure
```
src/
├── components/          # React components
├── config/             # Configuration files
├── contexts/           # React contexts
├── pages/              # Next.js pages
├── services/           # API services
├── styles/             # CSS styles
└── types/              # TypeScript types
```

### Adding New Environments

1. Create a new `.env.{environment}` file
2. Add corresponding npm scripts in `package.json`
3. Update deployment documentation

## License

This project is proprietary and confidential.