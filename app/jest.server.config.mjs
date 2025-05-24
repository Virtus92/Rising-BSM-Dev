import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read tsconfig to get path mappings
const tsconfig = JSON.parse(readFileSync(resolve('./tsconfig.json'), 'utf-8'));

/** @type {import('jest').Config} */
export default {
  displayName: 'Server Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  
  testMatch: [
    '**/app/api/**/*.test.(ts|tsx)',
    '**/features/**/api/**/*.test.(ts|tsx)',
    '**/features/**/services/**/*.test.(ts|tsx)',
    '**/core/services/**/*.test.(ts|tsx)',
    '**/core/repositories/**/*.test.(ts|tsx)',
    '**/core/db/**/*.test.(ts|tsx)',
    '**/__tests__/server/**/*.test.(ts|tsx)'
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    // Mock client-side modules for server tests
    '^@/components/(.*)$': '<rootDir>/src/__mocks__/components.js',
    '^@/shared/components/(.*)$': '<rootDir>/src/__mocks__/components.js',
    '^@/features/(.*)/(components|hooks)/(.*)$': '<rootDir>/src/__mocks__/components.js',
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.server.setup.js'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  collectCoverageFrom: [
    'src/app/api/**/*.{ts,tsx}',
    'src/features/**/api/**/*.{ts,tsx}',
    'src/features/**/services/**/*.{ts,tsx}',
    'src/core/services/**/*.{ts,tsx}',
    'src/core/repositories/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
  ],
  
  coverageDirectory: 'coverage/server',
  coverageReporters: ['text', 'lcov', 'html'],
};