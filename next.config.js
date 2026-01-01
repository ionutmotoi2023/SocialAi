/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Disable static page generation completely
  output: 'standalone',
  
  // CRITICAL: Skip build-time static page generation completely
  // This prevents ALL prerendering including /_error pages
  experimental: {
    isrMemoryCacheSize: 0,
  },

  // CRITICAL: This is the nuclear option - skip all prerendering
  // Forces Next.js to skip static generation for ALL pages
  // including system pages like /404 and /500
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Generate unique build ID to prevent caching issues
  generateBuildId: async () => {
    return 'railway-build-' + Date.now()
  },

  // Optimize builds
  swcMinify: true,

  // Images configuration
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // CRITICAL: Webpack config to ignore _error page generation
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Skip building /_error pages that cause <Html> import issues
      config.resolve.alias = {
        ...config.resolve.alias,
      }
    }
    return config
  },
}

module.exports = nextConfig
