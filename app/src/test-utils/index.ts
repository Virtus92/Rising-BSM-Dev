/**
 * Common Test Utilities for Rising-BSM
 * 
 * This module provides common testing utilities, mocks, and helpers
 * to ensure consistent testing patterns across the application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';

// Re-export commonly used testing utilities
export * from '@testing-library/react';
export { userEvent };

/**
 * Custom render function that includes providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // TODO: Add providers here (AuthProvider, QueryProvider, etc.)
  return render(ui, options);
}

/**
 * Mock Next.js API route for testing
 */
export async function testApiRoute(
  handler: Function,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    params?: Record<string, string>;
  } = {}
) {
  const { method = 'GET', body, headers = {}, query = {}, params = {} } = options;
  
  // Create URL with query parameters
  const url = new URL('http://localhost:3000/api/test');
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Create mock request
  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  // Call handler with params wrapped in Promise for Next.js 15
  const response = await handler(request, { params: Promise.resolve(params) });
  
  // Parse response
  let data;
  try {
    const text = await response.text();
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data
  };
}

/**
 * Create mock user for testing
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    status: 'ACTIVE',
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock customer for testing
 */
export function createMockCustomer(overrides?: Partial<any>) {
  return {
    id: 1,
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '123-456-7890',
    postalCode: '12345',
    country: 'USA',
    status: 'ACTIVE',
    type: 'INDIVIDUAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock request for testing
 */
export function createMockRequest(overrides?: Partial<any>) {
  return {
    id: 1,
    name: 'Test Request',
    email: 'request@example.com',
    message: 'Test message',
    status: 'NEW',
    type: 'general',
    source: 'form',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create mock appointment for testing
 */
export function createMockAppointment(overrides?: Partial<any>) {
  return {
    id: 1,
    title: 'Test Appointment',
    customerId: 1,
    appointmentDate: new Date(),
    duration: 60,
    status: 'PLANNED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Mock service factory for testing
 */
export function createMockService(methods: Record<string, jest.Mock>) {
  return methods;
}

/**
 * Mock repository factory for testing
 */
export function createMockRepository(methods?: Partial<any>) {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCriteria: jest.fn(),
    findOneByCriteria: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    bulkUpdate: jest.fn(),
    transaction: jest.fn(),
    ...methods
  };
}

/**
 * Mock logger for testing
 */
export function createMockLogger() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn()
  };
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Assert API response format
 */
export function assertApiResponse(response: any, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus);
  expect(response.data).toBeDefined();
  expect(response.data.success).toBeDefined();
  expect(response.data.timestamp).toBeDefined();
}

/**
 * Mock authentication context
 */
export function mockAuthContext(user?: any) {
  return {
    user: user || createMockUser(),
    isAuthenticated: !!user,
    signIn: jest.fn(),
    signOut: jest.fn(),
    loading: false
  };
}

/**
 * Import polyfills for test environment
 */
import './polyfills';

/**
 * Setup MSW for API mocking
 */
export { setupServer } from 'msw/node';