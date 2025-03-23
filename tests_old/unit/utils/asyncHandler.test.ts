import asyncHandler from '../../../utils/asyncHandler';
import { Request, Response, NextFunction } from 'express';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

describe('Async Handler Utility', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  
  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn().mockReturnThis() as any,
      status: jest.fn().mockReturnThis() as any
    };
    
    next = jest.fn();
  });
  
  test('should execute async function and resolve normally', async () => {
    const mockData = { success: true };
    const mockHandler = jest.fn(async () => mockData);
    const wrappedHandler = asyncHandler(mockHandler);
    
    await wrappedHandler(req as Request, res as Response, next);
    
    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
  
  test('should catch errors and pass them to next', async () => {
    const error = new Error('Async error');
    const mockHandler = jest.fn(async () => { throw error; });
    const wrappedHandler = asyncHandler(mockHandler);
    
    await wrappedHandler(req as Request, res as Response, next);
    
    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
  
  test('should work with functions that return a response', async () => {
    const mockHandler = jest.fn(async (_req: Request, res: Response) => {
      return res.json({ success: true });
    });
    
    const wrappedHandler = asyncHandler(mockHandler);
    
    await wrappedHandler(req as Request, res as Response, next);
    
    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });
});