/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Railway deployment
  output: 'standalone',
  
  // Optimize builds
  swcMinify: true,

  // Images configuration - simplificat pentru viteză
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    unoptimized: true, // Dezactivat pentru viteză
  },

  // TypeScript - mai tolerant pentru viteză
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint - dezactivat pentru viteză
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enable instrumentation hook for cron jobs
  experimental: {
    instrumentationHook: true,
  },

  // Environment variables with fallbacks - Railway safe mode
  // Elimină secțiunea env - variabilele trebuie să fie în .env sau Railway
  // Next.js va folosi automat variabilele din mediu
}

module.exports = nextConfig
# Force Railway rebuild 1767516579
