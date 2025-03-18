module.exports = {
    rootDir: '.',
    
    testEnvironment: 'node',
    
    testMatch: [
        '**/__tests__/**/*.js?(x)',
        '**/?(*.)+(spec|test).js?(x)'
    ],
    
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
        '!**/jest.config.js',
        '!**/jest.setup.js',
    ],
    
    testTimeout: 30000,
    
    clearMocks: true,
    
    verbose: true,

    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70,
        },
    },

    // Add the setup file
    setupFiles: ['./jest.setup.js'],
    
    // Add the teardown file
    globalTeardown: './jest.teardown.js',

    detectOpenHandles: true,
};