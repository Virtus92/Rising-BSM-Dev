import { BaseEntity } from './BaseEntity';
import { RequestDataHistory } from './RequestDataHistory';

/**
 * Data types for structured request data
 */
export type RequestDataType = 'json' | 'text' | 'html' | 'markdown' | 'file' | 'conversation';

/**
 * Entity class for structured request data
 * 
 * Used to store AI-processed or manually entered structured data related to a request
 */
export class RequestData extends BaseEntity {
  /**
   * ID of the parent request
   */
  requestId: number;
  
  /**
   * Category for organizing data (used for tabs)
   */
  category: string;
  
  /**
   * Display label for the data
   */
  label: string;
  
  /**
   * Display order (for sorting in UI)
   */
  order: number;
  
  /**
   * Type of data stored
   */
  dataType: RequestDataType;
  
  /**
   * The actual structured data
   */
  data: any;
  
  /**
   * Validation status
   */
  isValid: boolean;
  
  /**
   * Identifier of the processor (AI agent, user, etc.)
   */
  processedBy?: string;
  
  /**
   * Version number
   */
  version: number;
  
  /**
   * ID of the user who created this data (if applicable)
   */
  createdById?: number;
  
  /**
   * Version history
   */
  history?: RequestDataHistory[];
  
  /**
   * Constructor
   * 
   * @param data - Initial data
   */
  constructor(data: Partial<RequestData> = {}) {
    super(data);
    
    this.requestId = data.requestId || 0;
    this.category = data.category || '';
    this.label = data.label || '';
    this.order = data.order !== undefined ? data.order : 0;
    this.dataType = data.dataType || 'json';
    this.data = data.data || {};
    this.isValid = data.isValid !== undefined ? data.isValid : true;
    this.processedBy = data.processedBy;
    this.version = data.version || 1;
    this.createdById = data.createdById;
    this.history = data.history;
  }
  
  /**
   * Validates if the data is valid and well-formed
   * 
   * @returns Validation status
   */
  validate(): boolean {
    // Basic validation - can be extended as needed
    if (!this.requestId || this.requestId <= 0) return false;
    if (!this.category || this.category.trim() === '') return false;
    if (!this.data) return false;
    
    // Type-specific validation
    switch (this.dataType) {
      case 'json':
        return typeof this.data === 'object';
      case 'conversation':
        return Array.isArray(this.data) && this.data.every(item => 
          item.role && typeof item.role === 'string' && 
          item.content && typeof item.content === 'string'
        );
      default:
        return true;
    }
  }
  
  /**
   * Increments the version number
   * 
   * @returns This instance for chaining
   */
  incrementVersion(): RequestData {
    this.version += 1;
    return this;
  }
  
  /**
   * Converts the entity to a plain object
   * 
   * @returns Plain object representation
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    return {
      ...baseObject,
      requestId: this.requestId,
      category: this.category,
      label: this.label,
      order: this.order,
      dataType: this.dataType,
      data: this.data,
      isValid: this.isValid,
      processedBy: this.processedBy,
      version: this.version,
      createdById: this.createdById
      // history is omitted intentionally, should be accessed separately
    };
  }
}