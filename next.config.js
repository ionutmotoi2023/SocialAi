/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Railway deployment
  output: 'standalone',
  
  // Optimize builds
  swcMinify: true,

  // Images configuration
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig
