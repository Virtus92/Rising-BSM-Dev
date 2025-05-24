// Integration test setup
require('@testing-library/jest-dom');

// Environment variables for integration tests
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
process.env.JWT_SECRET = 'test-secret';

// Setup MSW (Mock Service Worker) for API mocking
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Create MSW server
const server = setupServer();

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Make MSW server available globally
global.mswServer = server;
global.http = http;
global.HttpResponse = HttpResponse;

// Browser API mocks
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

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});