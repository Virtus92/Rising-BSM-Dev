import { Request, Response, NextFunction } from 'express';

/**
 * Create a mock Express Request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Request {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    path: '',
    url: '',
    method: 'GET',
    protocol: 'http',
    originalUrl: '',
    hostname: 'localhost',
    ip: '127.0.0.1',
    get: jest.fn((name: string) => req.headers[name.toLowerCase()]),
    ...overrides
  } as unknown as Request;
  
  return req;
}

/**
 * Create a mock Express Response object
 */
export function createMockResponse(): Response {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null,
    
    status: jest.fn(function(code: number) {
      this.statusCode = code;
      return this;
    }),
    
    json: jest.fn(function(body: any) {
      this.body = body;
      return this;
    }),
    
    send: jest.fn(function(body: any) {
      this.body = body;
      return this;
    }),
    
    setHeader: jest.fn(function(name: string, value: string) {
      this.headers[name] = value;
      return this;
    }),
    
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
    render: jest.fn(),
    end: jest.fn(),
    sendStatus: jest.fn()
  } as unknown as Response;
  
  return res;
}

/**
 * Create a mock Express NextFunction
 */
export function createMockNext(): NextFunction {
  return jest.fn();
}

/**
 * Create all Express mocks in one call
 */
export function createExpressMocks(requestOverrides: Partial<Request> = {}) {
  return {
    req: createMockRequest(requestOverrides),
    res: createMockResponse(),
    next: createMockNext()
  };
}
