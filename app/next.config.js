/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  
  // Properly mark routes to avoid Edge runtime issues
  // Keep all auth-related and database-related code in NodeJS runtime
  output: 'standalone',
  
  // Next.js 15.3.1 uses serverExternalPackages at the top level
  serverExternalPackages: [
    'jsonwebtoken',
    'bcryptjs',
    '@prisma/client',
    'jose'
  ],
  
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser')
    };
    
    return config;
  }
}

module.exports = nextConfig
