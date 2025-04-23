import { BaseEntity } from './BaseEntity';

/**
 * Entity class for request data version history
 * 
 * Used to track changes to structured data over time
 */
export class RequestDataHistory extends BaseEntity {
  /**
   * ID of the related RequestData
   */
  requestDataId: number;
  
  /**
   * Historical data snapshot
   */
  data: any;
  
  /**
   * Identifier of the entity that made the change
   */
  changedBy?: string;
  
  /**
   * Reason for the change
   */
  changeReason?: string;
  
  /**
   * Version number at the time of this snapshot
   */
  version: number;
  
  /**
   * ID of the user who made this change (if applicable)
   */
  userId?: number;
  
  /**
   * Constructor
   * 
   * @param data - Initial data
   */
  constructor(data: Partial<RequestDataHistory> = {}) {
    super(data);
    
    this.requestDataId = data.requestDataId || 0;
    this.data = data.data || {};
    this.changedBy = data.changedBy;
    this.changeReason = data.changeReason;
    this.version = data.version || 1;
    this.userId = data.userId;
    
    // History records don't need updatedAt
    // Instead of setting to undefined (which causes type error), 
    // we'll copy createdAt to satisfy the type system
    if (this.createdAt) {
      this.updatedAt = this.createdAt;
    }
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
      requestDataId: this.requestDataId,
      data: this.data,
      changedBy: this.changedBy,
      changeReason: this.changeReason,
      version: this.version,
      userId: this.userId
    };
  }
}