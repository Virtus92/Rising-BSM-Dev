
import { Request, Response } from 'express';
import { requestLogger } from '../../../middleware/request-logger.middleware';
import logger from '../../../utils/logger';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock logger
jest.mock('../../../utils/logger', () => ({
  httpRequest: jest.fn(),
  __esModule: true,
  default: {
    httpRequest: jest.fn()
  }
}));

describe('Request Logger Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      path: '/test',
      method: 'GET'
    } as Partial<Request>;
    
    res = {
      on: jest.fn() as any,
      statusCode: 200
    };
    
    next = jest.fn();
  });
  
  test('should call next middleware', () => {
    requestLogger(req as Request, res as Response, next);
    
    expect(next).toHaveBeenCalled();
  });
  
  test('should register finish event listener', () => {
    requestLogger(req as Request, res as Response, next);
    
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
  
  test('should log HTTP request when response is finished', () => {
    requestLogger(req as Request, res as Response, next);
    
    // Get the finish handler and call it
    const finishHandler = (res.on as jest.Mock).mock.calls[0][1] as () => void;
    finishHandler();
    
    expect(logger.httpRequest).toHaveBeenCalledWith(
      req,
      res,
      expect.any(Number)
    );
  });
  
  test('should skip logging for health check endpoints', () => {
    // Create a new object instead of modifying read-only property
    req = { ...req, path: '/health' } as Partial<Request>;
    
    requestLogger(req as Request, res as Response, next);
    
    expect(res.on).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    
    // Also test API health endpoint
    req = { ...req, path: '/api/v1/health' } as Partial<Request>;
    
    requestLogger(req as Request, res as Response, next);
    
    expect(res.on).not.toHaveBeenCalled();
  });
});