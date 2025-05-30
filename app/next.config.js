/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages at top level as per Next.js 15.3.1 requirements
  serverExternalPackages: [
    'jsonwebtoken',
    'bcryptjs',
    '@prisma/client',
    'jose'
  ],
  
  // Use the new ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src']
  },
  
  // Configure server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  
  // Properly mark routes to avoid Edge runtime issues
  // Keep all auth-related and database-related code in NodeJS runtime
  output: 'standalone',
  
  // Remove duplicate serverExternalPackages declaration

  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Only apply polyfills on client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser')
      };
    }
    
    return config;
  }
}

module.exports = nextConfig
