// Optional: configure or set up a testing framework before each test
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    forEach: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  redirect: jest.fn(),
}));

// Mock next/headers for server components
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(),
    set: jest.fn(),
  })),
  headers: jest.fn(() => new Map()),
}));

// Crypto API for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '00000000-0000-0000-0000-000000000000',
    getRandomValues: (arr: any) => arr.fill(0),
    subtle: {}
  },
});

// Suppress Next.js console warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('next-route-loader') || args[0].includes('Use the `src` directory'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock window.fetch
global.fetch = jest.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  
  private callback: IntersectionObserverCallback;
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Clean up after each test
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
