import { IBaseService, ServiceOptions } from './IBaseService';
import { RequestData } from '../entities/RequestData';
import { 
  CreateRequestDataDto, 
  UpdateRequestDataDto, 
  RequestDataDto, 
  RequestDataHistoryDto 
} from '../dtos/RequestDataDtos';

/**
 * Service interface for managing structured request data
 */
export interface IRequestDataService extends IBaseService<RequestData, CreateRequestDataDto, UpdateRequestDataDto, RequestDataDto> {
  /**
   * Find request data by request ID and optional category
   * 
   * @param requestId - ID of the request
   * @param category - Optional category to filter by
   * @param options - Service options
   * @returns List of request data items
   */
  findRequestData(
    requestId: number, 
    category?: string, 
    options?: ServiceOptions
  ): Promise<RequestDataDto[]>;
  
  /**
   * Create new request data
   * 
   * @param data - Data to create
   * @param options - Service options
   * @returns Created data
   */
  createRequestData(
    data: CreateRequestDataDto, 
    options?: ServiceOptions
  ): Promise<RequestDataDto>;
  
  /**
   * Update request data with version history
   * 
   * @param id - ID of the data to update
   * @param data - Updated data
   * @param options - Service options
   * @returns Updated data
   */
  updateRequestData(
    id: number, 
    data: UpdateRequestDataDto, 
    options?: ServiceOptions
  ): Promise<RequestDataDto>;
  
  /**
   * Get history of changes for request data
   * 
   * @param id - ID of the request data
   * @param options - Service options
   * @returns History entries
   */
  getRequestDataHistory(
    id: number, 
    options?: ServiceOptions
  ): Promise<RequestDataHistoryDto[]>;
}