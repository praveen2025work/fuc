/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["assets.co.dev", "images.unsplash.com", "ui-avatars.com"],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  output: process.env.BUILD_MODE === 'static' ? 'export' : undefined,
  trailingSlash: true,
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  webpack: (config, context) => {
    config.optimization.minimize = process.env.NEXT_PUBLIC_CO_DEV_ENV !== "preview";
    
    if (!context.isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  }
};

export default nextConfig;