/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to prevent double-mounting
  reactStrictMode: false,
  
  // Wichtige Umgebungsvariablen auf Client-Seite verfügbar machen
  env: {
    // API-URLs und Basis-Konfiguration
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  },
  
  // ESLint während des Builds deaktivieren
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image-Optimierung konfigurieren
  images: {
    domains: ['localhost'],
  },

  // Add a Webpack rule to ignore .html files
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

module.exports = nextConfig;
