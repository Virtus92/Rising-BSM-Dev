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
        'src/**/*.{js,jsx}',
        '!**/node_modules/**',
        '!**/vendor/**'
    ],
    
    testTimeout: 10000,
    
    clearMocks: true,
    
    verbose: true,
};