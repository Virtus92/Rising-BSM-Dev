import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read tsconfig to get path mappings
const tsconfig = JSON.parse(readFileSync(resolve('./tsconfig.json'), 'utf-8'));

/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)'
  ],
  
  // Exclude server-side tests that require Node.js runtime
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/app/api/',
    '<rootDir>/src/features/.*/api/',
    '<rootDir>/src/core/db/',
    '<rootDir>/src/core/services/__tests__/',
    '<rootDir>/src/core/repositories/__tests__/',
    '<rootDir>/src/core/errors/__tests__/',
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    '\\.(css|less|sass|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/src/__mocks__/fileMock.js',
    // Mock server-only modules
    '^server-only$': '<rootDir>/src/__mocks__/server-only.js',
    // Mock Next.js server modules
    '^next/server$': '<rootDir>/src/__mocks__/next-server.js',
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!src/app/api/**/*',
    '!src/core/db/**/*',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};