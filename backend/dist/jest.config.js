"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
                tsconfig: 'tsconfig.json',
            }],
    },
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '**/*.ts',
        '!**/node_modules/**',
        '!**/dist/**',
        '!**/__tests__/**',
        '!**/types/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    }
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map