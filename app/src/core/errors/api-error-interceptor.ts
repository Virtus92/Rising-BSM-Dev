import { Logger } from './error-handler';

/**
 * API request error class
 */
export class ApiRequestError extends Error {
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Error details
   */
  errors?: string[];
  
  /**
   * Constructor
   * 
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param errors - Error details
   */
  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Restore prototype chain in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Generic handler for API errors
 * @param error - Error to handle
 * @param logger - Optional logger instance
 * @returns Promise that rejects with the original error
 */
export async function handleApiError(error: any, logger?: Logger): Promise<never> {
  // Log error if logger is provided
  if (logger) {
    if (error instanceof ApiRequestError) {
      logger.error(`API Error ${error.statusCode}: ${error.message}`, {
        errors: error.errors
      });
    } else {
      logger.error(`API Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // Fallback to console if logger not provided
    console.error('API Error:', error as Error);
  }
  
  // Format error for client consumption
  const formattedError = error instanceof ApiRequestError
    ? error
    : new ApiRequestError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500
      );
      
  // Special handling for common status codes
  if (formattedError.statusCode === 401 && typeof window !== 'undefined') {
    // Redirect to login page with return URL
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth/login?returnUrl=${returnUrl}`;
  }
  
  // Always reject with the formatted error
  return Promise.reject(formattedError);
}

/**
 * Interface for error handlers
 */
export interface IErrorInterceptor {
  /**
   * Handle API error
   * @param error API error
   * @returns Observable with original error or transformed error
   */
  intercept(error: ApiRequestError): Promise<never>;
}

/**
 * Configuration for API error interceptor
 */
export interface ApiErrorInterceptorConfig {
  /**
   * Enable verbose logging
   */
  verbose?: boolean;
  
  /**
   * Custom error handler for specific status codes
   */
  statusHandlers?: Record<number, (error: ApiRequestError) => Promise<never>>;
  
  /**
   * Retry failed requests
   */
  retry?: {
    /**
     * Status codes to retry
     */
    statusCodes: number[];
    
    /**
     * Maximum number of retries
     */
    maxRetries: number;
    
    /**
     * Delay between retries in milliseconds
     */
    delayMs: number;
    
    /**
     * Use exponential backoff
     */
    exponentialBackoff?: boolean;
  };
}

/**
 * API error interceptor
 * Handles API errors consistently across the application
 */
export class ApiErrorInterceptor implements IErrorInterceptor {
  private retryCount: Record<string, number> = {};
  
  /**
   * Constructor
   * @param logger Logging service
   * @param config Interceptor configuration
   */
  constructor(
    private readonly logger: Logger,
    private readonly config: ApiErrorInterceptorConfig = {}
  ) {}
  
  /**
   * Handle API error
   * @param error API error
   * @returns Promise that rejects with the error
   */
  async intercept(error: ApiRequestError): Promise<never> {
    // Log error details
    if (this.config.verbose) {
      this.logger.error(`API Error: ${error.message}`, {
        statusCode: error.statusCode,
        errors: error.errors
      });
    } else {
      this.logger.error(`API Error ${error.statusCode}: ${error.message}`);
    }
    
    // Check for custom status handler
    if (
      this.config.statusHandlers && 
      error.statusCode && 
      this.config.statusHandlers[error.statusCode]
    ) {
      return this.config.statusHandlers[error.statusCode](error);
    }
    
    // Check for retry logic
    if (
      this.config.retry && 
      error.statusCode && 
      this.config.retry.statusCodes.includes(error.statusCode)
    ) {
      const requestId = this.generateRequestId(error);
      this.retryCount[requestId] = (this.retryCount[requestId] || 0) + 1;
      
      if (this.retryCount[requestId] <= this.config.retry.maxRetries) {
        // Calculate delay with optional exponential backoff
        const delay = this.config.retry.exponentialBackoff
          ? this.config.retry.delayMs * Math.pow(2, this.retryCount[requestId] - 1)
          : this.config.retry.delayMs;
          
        this.logger.info(`Retrying request (${this.retryCount[requestId]}/${this.config.retry.maxRetries}) after ${delay}ms`);
        
        // Wait for delay
        await new Promise((resolve) => setTimeout(resolve, delay));
        
        // Retry logic would go here in a real implementation
        // For this example, we just continue to the rejection
      } else {
        // Clean up retry count
        delete this.retryCount[requestId];
      }
    }
    
    // Special handling for common status codes
    switch (error.statusCode) {
      case 401:
        // Unauthorized - Handle authentication errors
        this.logger.warn('Authentication failed. Redirecting to login...');
        
        // Handle client-side only
        if (typeof window !== 'undefined') {
          // Redirect to login page with return URL
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/auth/login?returnUrl=${returnUrl}`;
        }
        break;
        
      case 403:
        // Forbidden - Handle authorization errors
        this.logger.warn('Authorization failed. Insufficient permissions.');
        break;
        
      case 404:
        // Not Found
        this.logger.warn(`Resource not found: ${error.message}`);
        break;
        
      case 422:
        // Validation Error
        this.logger.warn(`Validation error: ${error.message}`, { errors: error.errors });
        break;
        
      case 429:
        // Too Many Requests
        this.logger.warn('Rate limit exceeded. Please try again later.');
        break;
    }
    
    // Always reject with the original error
    return Promise.reject(error);
  }
  
  /**
   * Generate a unique ID for a request to track retries
   * @param error API error
   * @returns Request ID
   */
  private generateRequestId(error: ApiRequestError): string {
    // This is a simple implementation - in a real app,
    // you might want to use more information from the request
    return `${error.statusCode}-${error.message.substring(0, 20)}`;
  }
}

/**
 * Create API error interceptor
 * @param logger Logging service
 * @param config Interceptor configuration
 * @returns API error interceptor
 */
export function createApiErrorInterceptor(
  logger: Logger,
  config: ApiErrorInterceptorConfig = {}
): IErrorInterceptor {
  return new ApiErrorInterceptor(logger, config);
}