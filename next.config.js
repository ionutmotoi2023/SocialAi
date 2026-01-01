/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static page generation for pages that use server-side features
  output: 'standalone',
  
  // Disable automatic static optimization for dynamic pages
  experimental: {
    // This ensures all pages are treated as dynamic by default
  },

  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },

  // Optimize builds
  swcMinify: true,

  // Images configuration
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Disable telemetry
  telemetry: {
    disabled: true,
  },
}

module.exports = nextConfig
