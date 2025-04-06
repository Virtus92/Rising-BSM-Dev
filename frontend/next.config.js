/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // API-URLs
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://localhost:3000/api',
    
    // Auth-Konfiguration
    JWT_SECRET: process.env.JWT_SECRET || 'your-default-super-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-default-key-change-in-production',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // Datenbank-URL (übernommen von Prisma)
    DATABASE_URL: process.env.DATABASE_URL,
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  },
  
  // App Router ist jetzt Standard in Next.js 13+
  // Experimentelles Flag nicht mehr nötig
  
  // ESLint während des Builds deaktivieren, da wir Probleme separat beheben
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Experimentelle Funktionen für die Unterstützung von Edge-Middleware
  experimental: {
    // Ermöglicht instrumentierte Builds für besseres Monitoring
    instrumentationHook: true,
  },
  
  // Image-Optimierung konfigurieren
  images: {
    domains: ['localhost'],
    // Weitere sichere Domains hier hinzufügen
  },
};

module.exports = nextConfig;