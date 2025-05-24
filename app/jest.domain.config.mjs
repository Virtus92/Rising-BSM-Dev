import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read tsconfig to get path mappings
const tsconfig = JSON.parse(readFileSync(resolve('./tsconfig.json'), 'utf-8'));

/** @type {import('jest').Config} */
export default {
  displayName: 'Domain Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  
  testMatch: [
    '**/domain/**/*.test.(ts|tsx)',
    '**/core/validation/**/*.test.(ts|tsx)',
    '**/core/security/**/*.test.(ts|tsx)',
    '**/__tests__/domain/**/*.test.(ts|tsx)'
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
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.domain.setup.js'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/core/validation/**/*.{ts,tsx}',
    'src/core/security/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
  ],
  
  coverageDirectory: 'coverage/domain',
  coverageReporters: ['text', 'lcov', 'html'],
};