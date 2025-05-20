module.exports = {
  // Test-Umgebung für DOM-Tests (React)
  testEnvironment: 'jsdom',
  
  // Root-Verzeichnis für Tests
  roots: ['<rootDir>/src'],
  
  // Globale Muster für Testdateien
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '**/*.test.tsx'
  ],
  
  // Dateien, die nicht transformiert werden sollen
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  
  // Coverage-Einstellungen
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/mocks/**/*.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/**/types.{ts,tsx}'
  ],
  
  // Verzeichnisse, die für Imports aufgelöst werden sollen
  moduleDirectories: ['node_modules', 'src'],
  
  // Dateinamen-Erweiterungen für Module
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Mock für Dateien, die nicht als JS/TS importiert werden können
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  
  // Pfad zu setup-Dateien, die vor jedem Test ausgeführt werden
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Transformationen für verschiedene Dateitypen
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
};
