import { IBaseRepository, QueryOptions, PaginationResult } from './IBaseRepository';
import { RequestData } from '../entities/RequestData';
import { RequestDataHistory } from '../entities/RequestDataHistory';

/**
 * Repository interface for RequestData operations
 */
export interface IRequestDataRepository extends IBaseRepository<RequestData> {
  /**
   * Create a new history record for a RequestData
   * 
   * @param data - History data to create
   * @returns Created history record
   */
  createHistory(data: Partial<RequestDataHistory>): Promise<RequestDataHistory>;
  
  /**
   * Find one RequestData by criteria
   * 
   * @param options - Search options
   * @returns RequestData if found, null otherwise
   */
  findOne(options: { criteria: any }): Promise<RequestData | null>;
  
  /**
   * Find all RequestData with optional criteria and pagination
   * 
   * @param options - Query options with optional criteria
   * @returns Paginated result of RequestData
   */
  findAll(options?: QueryOptions & { criteria?: any, orderBy?: any }): Promise<PaginationResult<RequestData>>;

  /**
   * Find RequestData entries by request ID
   * 
   * @param requestId - Request ID to look for
   * @returns List of RequestData entries related to the request
   */
  findByRequestId(requestId: number): Promise<RequestData[]>;
}