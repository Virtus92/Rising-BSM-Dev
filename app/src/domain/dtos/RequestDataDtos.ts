import { BaseResponseDto } from './BaseDto';
import { RequestData, RequestDataType } from '../entities/RequestData';

/**
 * DTO for RequestData response
 */
export interface RequestDataDto extends BaseResponseDto {
  /**
   * ID of the parent request
   */
  requestId: number;
  
  /**
   * Category for organizing data
   */
  category: string;
  
  /**
   * Display label
   */
  label: string;
  
  /**
   * Display order
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
   * Identifier of the processor
   */
  processedBy?: string;
  
  /**
   * Version number
   */
  version: number;
  
  /**
   * ID of the creating user
   */
  createdById?: number;
}

/**
 * DTO for creating RequestData
 */
export interface CreateRequestDataDto {
  /**
   * ID of the parent request
   */
  requestId: number;
  
  /**
   * Category for organizing data
   */
  category: string;
  
  /**
   * Display label
   */
  label: string;
  
  /**
   * Display order
   */
  order?: number;
  
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
  isValid?: boolean;
  
  /**
   * Identifier of the processor
   */
  processedBy?: string;
}

/**
 * DTO for updating RequestData
 */
export interface UpdateRequestDataDto {
  /**
   * Category for organizing data
   */
  category?: string;
  
  /**
   * Display label
   */
  label?: string;
  
  /**
   * Display order
   */
  order?: number;
  
  /**
   * Type of data stored
   */
  dataType?: RequestDataType;
  
  /**
   * The actual structured data
   */
  data?: any;
  
  /**
   * Validation status
   */
  isValid?: boolean;
  
  /**
   * Identifier of the processor
   */
  processedBy?: string;
  
  /**
   * Version number
   */
  version?: number;
  
  /**
   * Reason for change (for history tracking)
   */
  changeReason?: string;
}

/**
 * DTO for RequestData history
 */
export interface RequestDataHistoryDto extends BaseResponseDto {
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
   * Version number
   */
  version: number;
  
  /**
   * ID of the user who made the change
   */
  userId?: number;
}

/**
 * Maps a RequestData entity to a DTO
 * 
 * @param entity - Entity to map
 * @returns Mapped DTO
 */
export function mapRequestDataToDto(entity: RequestData): RequestDataDto {
  return {
    id: entity.id,
    requestId: entity.requestId,
    category: entity.category,
    label: entity.label,
    order: entity.order,
    dataType: entity.dataType,
    data: entity.data,
    isValid: entity.isValid,
    processedBy: entity.processedBy,
    version: entity.version,
    createdById: entity.createdById,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt?.toISOString() || entity.createdAt.toISOString()
  };
}