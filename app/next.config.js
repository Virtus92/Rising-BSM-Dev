/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix polyfills for client-side only
    if (!isServer) {
      // Ensure proper handling of Node.js core modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        util: require.resolve('util')
      };

      // Make sure polyfills are properly handled
      config.plugins = [
        ...config.plugins,
        // Provide global variables for browser polyfills
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ];
    }
    
    return config;
  },
}

module.exports = nextConfig;