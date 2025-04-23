/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove swcMinify as it's no longer a recognized option in this Next.js version
  webpack: (config) => {
    // Add fallbacks for crypto-related modules that are required by jsonwebtoken and bcryptjs
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      vm: false, // Add empty shim for the vm module that asn1.js requires
      fs: false, // Add empty shim for the fs module
      path: false, // Add empty shim for the path module
      os: false // Add empty shim for the os module
    };
    return config;
  },
}

module.exports = nextConfig;