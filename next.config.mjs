/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure image optimization
  images: {
    domains: ["assets.co.dev", "images.unsplash.com", "ui-avatars.com"],
    unoptimized: process.env.NODE_ENV === 'production', // Disable optimization for static export
  },
  
  // Enable static export for IIS deployment when building for production
  output: process.env.BUILD_MODE === 'static' ? 'export' : undefined,
  
  // Configure trailing slash for IIS compatibility
  trailingSlash: true,
  
  // Configure asset prefix and base path for subdirectory deployment
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  webpack: (config, context) => {
    config.optimization.minimize = process.env.NEXT_PUBLIC_CO_DEV_ENV !== "preview";
    
    // Add fallbacks for Node.js modules in client-side builds
    if (!context.isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Configure headers for better security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
