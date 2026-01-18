import type { NextConfig } from 'next'
import path from 'path';

/**
 * Next.js Configuration for LexiGov AI
 * Compatible with Next.js 16.x
 */
const nextConfig: NextConfig = {
  // Turbopack Configuration - specify workspace root
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },

  // React Strict Mode for better error checking
  reactStrictMode: true,

  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 384, 750, 1920],
    minimumCacheTTL: 60,
  },

  // Environment Variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },

  // Output Configuration
  output: 'standalone',
}

export default nextConfig;
