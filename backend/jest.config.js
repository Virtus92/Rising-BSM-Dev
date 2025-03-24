/**
 * Jest configuration file
 * 
 * This configuration enables testing for TypeScript Node.js applications
 * with ES Modules support and proper mocking capabilities for Prisma.
 */
export default {
  // Specify the test environment
  testEnvironment: 'node',
  
  // Transform files with ts-jest for TypeScript support
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }]
  },
  
  // Handle ESM modules
  extensionsToTreatAsEsm: ['.ts'],
  
  // Module name mapper for path aliases and mocks
  moduleNameMapper: {
    // Map import paths - adjust these to match your project structure
    '^@/(.*)$': '<rootDir>/$1',
    // Handle CSS imports (if needed)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Specify test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'controllers/**/*.ts',
    'services/**/*.ts',
    'repositories/**/*.ts',
    'routes/**/*.ts',
    'utils/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Mock resolution
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  
  // Global timeout for tests
  testTimeout: 10000
};