module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: false // Important for ES modules
    }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Add plugin to transform runtime for async/await
    '@babel/plugin-transform-runtime'
  ]
};
