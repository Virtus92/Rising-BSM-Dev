/** @type {import('jest').Config} */
const config = {
  displayName: 'Backend Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts',
    '**/tests/api/**/*.test.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '**/src/**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/config/setup.js'],
  testTimeout: 30000, // 30 seconds
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: false,
};

export default config;
