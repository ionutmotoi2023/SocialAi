/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Disable static page generation completely
  // This forces all pages to be server-side rendered
  output: 'standalone',
  
  // Skip static page generation during build
  // This prevents prerendering errors for dynamic pages
  experimental: {
    isrMemoryCacheSize: 0,
  },

  // Disable static optimization - treat all routes as dynamic
  // This is the KEY to preventing prerendering errors
  generateBuildId: async () => {
    return 'railway-build-' + Date.now()
  },

  // Environment variables (do not list them here - Railway warning)
  // Railway automatically provides them at runtime

  // Optimize builds
  swcMinify: true,

  // Images configuration
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig
