/**
 * Models for request data
 */

/**
 * Request data types
 */
export type RequestDataType = 'json' | 'text' | 'html' | 'markdown' | 'conversation';

/**
 * Base request data response
 */
export interface RequestDataResponse {
  /**
   * Request data ID
   */
  id: number;
  
  /**
   * Request ID
   */
  requestId: number;
  
  /**
   * Data category
   */
  category: string;
  
  /**
   * Human-readable label
   */
  label: string;
  
  /**
   * Data type
   */
  dataType: RequestDataType;
  
  /**
   * Data content
   */
  data: any;
  
  /**
   * Entity that processed the data
   */
  processedBy: string;
  
  /**
   * Version number
   */
  version: number;
  
  /**
   * Display order
   */
  order: number;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
}

/**
 * Request data history response
 */
export interface RequestDataHistoryResponse {
  /**
   * History entry ID
   */
  id: number;
  
  /**
   * Request data ID
   */
  requestDataId: number;
  
  /**
   * Data content at this version
   */
  data: any;
  
  /**
   * Entity that changed the data
   */
  changedBy: string;
  
  /**
   * Reason for change
   */
  changeReason: string;
  
  /**
   * Version number
   */
  version: number;
  
  /**
   * Timestamp of the change
   */
  createdAt: string;
}

/**
 * Create request data request
 */
export interface CreateRequestDataRequest {
  /**
   * Request ID
   */
  requestId: number;
  
  /**
   * Data category
   */
  category: string;
  
  /**
   * Human-readable label
   */
  label: string;
  
  /**
   * Data type
   */
  dataType: RequestDataType;
  
  /**
   * Data content
   */
  data: any;
  
  /**
   * Entity that processed the data
   */
  processedBy: string;
  
  /**
   * Display order
   */
  order?: number;
}

/**
 * Update request data request
 */
export interface UpdateRequestDataRequest {
  /**
   * Data content
   */
  data: any;
  
  /**
   * Entity that processed the data
   */
  processedBy: string;
  
  /**
   * Reason for the update
   */
  changeReason?: string;
  
  /**
   * Human-readable label
   */
  label?: string;
  
  /**
   * Display order
   */
  order?: number;
}

/**
 * Get request data request
 */
export interface GetRequestDataRequest {
  /**
   * Request ID
   */
  requestId: number;
  
  /**
   * Data category (optional filter)
   */
  category?: string;
  
  /**
   * Include history flag
   */
  includeHistory?: boolean;
}

/**
 * Request data list response
 */
export interface RequestDataListResponse {
  /**
   * Request data array
   */
  data: RequestDataResponse[];
  
  /**
   * History by data ID (if requested)
   */
  history?: Record<number, RequestDataHistoryResponse[]>;
}
