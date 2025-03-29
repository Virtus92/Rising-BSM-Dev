/**
 * Jest Configuration for Rising-BSM Backend Testing
 */
export default {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Define the test environment
  testEnvironment: 'node',
  
  // Regular expressions that identify test files
  testMatch: [
    '**/tests/**/*.test.(ts|js)',
    '**/?(*.)+(spec|test).(ts|js)'
  ],

  // Files to exclude from testing
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        // Use ESM modules
        useESM: true
      }
    ]
  },

  // File extensions to consider for modules
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Extension mapping
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  // Configure coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

  // Configure test result reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml'
      }
    ]
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/utils/global-setup.js',
  globalTeardown: '<rootDir>/tests/utils/global-teardown.js',

  // Sets up test environment for each test file
  setupFilesAfterEnv: ['<rootDir>/tests/utils/test-setup.js'],

  // Force using v8 for coverage to work with ESM
  coverageProvider: 'v8',

  // Use fake timers for testing time-dependent code
  timers: 'fake',

  // Verbosity level
  verbose: true,

  // Handle ESM modules 
  extensionsToTreatAsEsm: ['.ts']
};
