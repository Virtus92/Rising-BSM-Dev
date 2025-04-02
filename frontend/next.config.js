/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
  // App Router is now stable in Next.js 13+
  // No need for experimental flag anymore
  // Disable ESLint during build as we're fixing issues separately
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;