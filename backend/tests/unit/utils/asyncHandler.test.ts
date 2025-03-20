import asyncHandler from '../../../utils/asyncHandler';
import { Request, Response, NextFunction } from 'express';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

describe('Async Handler Utility', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    req = {};
    // Fix response mock typing
    res = {
      json: jest.fn().mockReturnThis() as any
    };
    next = jest.fn();
  });
  
  test('should execute async function and resolve normally', async () => {
    const mockData = { success: true };
    // Type assertion to fix typing
    const mockHandler = jest.fn().mockResolvedValue(mockData) as any;
    const wrappedHandler = asyncHandler(mockHandler);
    
    await wrappedHandler(req as Request, res as Response, next);
    
    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should catch errors and pass them to next', async () => {
    const error = new Error('Async error');
    // Type assertion to fix typing
    const mockHandler = jest.fn().mockRejectedValue(error) as any;
    const wrappedHandler = asyncHandler(mockHandler);
    
    await wrappedHandler(req as Request, res as Response, next);
    
    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
  
  test('should work with functions that return a response', async () => {
    // Type assertion to fix typing
    const mockHandler = jest.fn().mockImplementation((_req, res) => {
      return Promise.resolve(res.json({ success: true }));
    }) as any;
    
    const wrappedHandler = asyncHandler(mockHandler);
    
    await wrappedHandler(req as Request, res as Response, next);
    
    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });
});