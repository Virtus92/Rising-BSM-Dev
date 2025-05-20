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
    
    // Fix for @tanstack modules to ensure proper bundling
    config.module.rules.push({
      test: /node_modules[\\/]@tanstack/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [require.resolve('next/dist/compiled/babel/preset-env')],
            [require.resolve('next/dist/compiled/babel/preset-react')]
          ],
          plugins: []
        }
      }
    });
    
    return config;
  },
  // Force transpilation of @tanstack packages
  transpilePackages: [
    '@tanstack/react-query',
    '@tanstack/react-query-devtools',
    '@tanstack/react-table'
  ],
}

module.exports = nextConfig;