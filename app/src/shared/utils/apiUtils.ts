/**
 * API response utilities
 * Standardized functions for handling API responses
 */

import { ApiResponse } from '@/core/api/types';

/**
 * Handle API response in a consistent way
 * 
 * This eliminates reliance on the 'message' property and provides
 * standardized error handling
 * 
 * @param response The API response
 * @param defaultErrorMessage Default error message to show if none provided
 * @returns Processed response data and error info
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  defaultErrorMessage: string = 'Operation failed'
): {
  data: T | null;
  error: string | null;
  success: boolean;
} {
  // If response was successful, return the data
  if (response.success && response.data) {
    return {
      data: response.data,
      error: null,
      success: true,
    };
  }
  
  // Handle error case
  return {
    data: null,
    error: response.error || defaultErrorMessage,
    success: false,
  };
}

/**
 * Create a standardized success response
 * 
 * @param data Response data
 * @returns Standardized API response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

/**
 * Create a standardized error response
 * 
 * @param error Error message or object
 * @param statusCode Optional status code
 * @returns Standardized API response
 */
export function createErrorResponse(
  error: string | Error,
  statusCode?: number
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: typeof error === 'string' ? error : error.message,
    statusCode,
  };
}

export const apiUtils = {
  processApiResponse,
  handleApiResponse,
  createSuccessResponse,
  createErrorResponse,
};

/**
 * Process API response
 * 
 * Extracts data from response and ensures proper error handling
 * 
 * @param responsePromise Promise that resolves to an API response
 * @param options Processing options
 * @returns Processed data
 */
export async function processApiResponse<T>(
  responsePromise: Promise<ApiResponse<T>>,
  options: { context?: string; defaultError?: string } = {}
): Promise<T> {
  try {
    const response = await responsePromise;
    
    // Check if response has expected shape
    if (!response) {
      throw new Error(options.defaultError || 'Invalid response received');
    }
    
    // If response indicates failure, throw error
    if (!response.success) {
      throw new Error(response.error || options.defaultError || 'Operation failed');
    }
    
    // If no data returned, throw error
    if (response.data === undefined || response.data === null) {
      throw new Error(options.defaultError || 'No data returned');
    }
    
    // Return the data
    return response.data;
  } catch (error) {
    // Add context to error message if provided
    if (options.context && error instanceof Error) {
      error.message = `[${options.context}] ${error.message}`;
    }
    
    // Rethrow the error
    throw error;
  }
}

export default apiUtils;
