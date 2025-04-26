/**
 * API Response interface for standardized responses
 */
export interface ApiResponse<T = any> {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Response message
   */
  message: string;
  
  /**
   * Response data
   */
  data: T;
  
  /**
   * HTTP status code
   */
  statusCode?: number;
  
  /**
   * Error information (for unsuccessful responses)
   */
  error?: ApiError;
}

/**
 * API Error interface
 */
export interface ApiError {
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code?: string;
  
  /**
   * HTTP status code
   */
  status?: number;
  
  /**
   * Error details
   */
  details?: any;
}

/**
 * API Request Error interface
 */
export interface ApiRequestError {
  /**
   * Error message
   */
  message: string;
  
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Error details
   */
  errors?: string[];
}

/**
 * API Validation Error interface
 */
export interface ApiValidationError {
  /**
   * Field name
   */
  field: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code?: string;
}
