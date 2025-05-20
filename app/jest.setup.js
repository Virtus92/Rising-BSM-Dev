const { loadEnvConfig } = require('@next/env');

// Lade Umgebungsvariablen aus .env.test oder .env.local
const projectDir = process.cwd();
loadEnvConfig(projectDir, process.env.NODE_ENV !== 'production');

// Globaler Setup für Tests
beforeEach(() => {
  // Stelle sicher, dass Mocks zurückgesetzt werden
  jest.resetModules();
  jest.clearAllMocks();
});

// Füge Jest-Matcher hinzu
require('@testing-library/jest-dom');

// Globaler Timeout für Tests erhöhen, wenn nötig
jest.setTimeout(10000);

// Unterdrücke Konsolenausgaben während der Tests
// (kann bei Bedarf auskommentiert werden, wenn Ausgaben gewünscht sind)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Füge Mocks für Umgebungsvariablen hinzu, die in der Anwendung verwendet werden
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// Mock für Browser-APIs, die in Node.js nicht verfügbar sind
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

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
