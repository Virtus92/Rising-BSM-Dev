module.exports = {
  testEnvironment: 'node',
  verbose: true,
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 10000,
  // Add projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '**/tests/utils/**/*.test.js',
        '**/tests/services/**/*.test.js',
        '**/tests/controllers/**/*.test.js',
        '**/tests/routes/**/*.test.js'
      ],
      testPathIgnorePatterns: ['/node_modules/', '/integration/']
    },
    {
      displayName: 'integration',
      testMatch: ['**/tests/integration/**/*.test.js'],
      testTimeout: 30000
    }
  ]
};
