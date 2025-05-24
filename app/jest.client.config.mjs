import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read tsconfig to get path mappings
const tsconfig = JSON.parse(readFileSync(resolve('./tsconfig.json'), 'utf-8'));

/** @type {import('jest').Config} */
export default {
  displayName: 'Client Tests',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  
  testMatch: [
    '**/components/**/*.test.(ts|tsx)',
    '**/hooks/**/*.test.(ts|tsx)', 
    '**/shared/**/*.test.(ts|tsx)',
    '**/__tests__/client/**/*.test.(ts|tsx)',
    '**/features/**/components/**/*.test.(ts|tsx)',
    '**/features/**/hooks/**/*.test.(ts|tsx)'
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
    // Mock server-only modules for client tests
    '^server-only$': '<rootDir>/src/__mocks__/server-only.js',
    '^next/server$': '<rootDir>/src/__mocks__/next-server.js',
    '^@/app/api/(.*)$': '<rootDir>/src/__mocks__/api.js',
    '^@/core/db/(.*)$': '<rootDir>/src/__mocks__/db.js',
    '^@/test-utils$': '<rootDir>/src/__mocks__/test-utils.js',
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.client.setup.js'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    'src/shared/components/**/*.{ts,tsx}',
    'src/features/**/components/**/*.{ts,tsx}',
    'src/features/**/hooks/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
  ],
  
  coverageDirectory: 'coverage/client',
  coverageReporters: ['text', 'lcov', 'html'],
};