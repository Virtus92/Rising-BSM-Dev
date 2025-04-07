/**
 * Test-Setup für Next.js API-Routes und Components
 * 
 * Dieses Skript konfiguriert die Testumgebung für Jest
 */

const { loadEnvConfig } = require('@next/env');

// Lade Umgebungsvariablen aus .env.test oder .env.local
const projectDir = process.cwd();
loadEnvConfig(projectDir, process.env.NODE_ENV !== 'production');

// Globaler Setup für Tests
global.beforeEach(() => {
  // Stelle sicher, dass Mocks zurückgesetzt werden
  jest.resetModules();
  jest.clearAllMocks();
});

// Füge Jest-Matcher hinzu
require('@testing-library/jest-dom');

// Mock für Next.js Router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock für window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
