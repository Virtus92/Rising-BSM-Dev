/**
 * Error Handler Types
 * Types for the error handling system
 */
import { NextRequest, NextResponse } from 'next/server';
import { IErrorHandler } from './types/IErrorHandler';

// Re-export IErrorHandler for compatibility
export type { IErrorHandler };

/**
 * Error Handler Middleware
 * Signature for the error handler middleware
 */
export type ErrorHandlerMiddleware = <T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse<T>>
) => (request: NextRequest, ...args: any[]) => Promise<NextResponse<T>>;

// Declare the error handler export with the IErrorHandler interface
declare const errorHandler: IErrorHandler;
export { errorHandler };
