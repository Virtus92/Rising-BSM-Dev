import { IBaseService } from './IBaseService';
import { Customer } from '../entities/Customer';
import { 
  CustomerCreateDto, 
  CustomerUpdateDto, 
  CustomerResponseDto, 
  CustomerDetailResponseDto,
  CustomerStatusUpdateDto,
  CustomerFilterParams
} from '../dtos/CustomerDtos';
import { PaginatedResult, OperationOptions, FilterCriteria, ErrorDetails } from '@/types/core/shared';
import { AuthContext } from '@/types/core/auth';

export interface ICustomerService extends IBaseService<
  Customer, 
  CustomerCreateDto, 
  CustomerUpdateDto, 
  CustomerResponseDto
> {
  /**
   * Retrieve detailed customer information
   * 
   * @param id - Customer ID
   * @param options - Operation options with optional auth context
   * @returns Detailed customer response or null
   * @throws {ErrorDetails} When retrieval fails
   */
  getCustomerDetails(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<CustomerDetailResponseDto | null>;
  
  /**
   * Update customer status
   * 
   * @param statusUpdateDto - Status update details
   * @param options - Operation options with auth context
   * @returns Updated customer response
   * @throws {ErrorDetails} When status update fails
   */
  updateStatus(
    statusUpdateDto: CustomerStatusUpdateDto, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<CustomerResponseDto>;
  
  /**
   * Retrieve comprehensive customer statistics
   * 
   * @param options - Operation options with auth context
   * @returns Customer statistics
   */
  getCustomerStatistics(
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersLastMonth: number;
    customersByType: Record<string, number>;
  }>;
  
  /**
   * Find similar customers based on attributes
   * 
   * @param id - Base customer ID
   * @param limit - Maximum number of similar customers to return
   * @param options - Operation options with optional auth context
   * @returns Similar customer responses
   */
  findSimilarCustomers(
    id: number, 
    limit?: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<CustomerResponseDto[]>;
  
  /**
   * Retrieve customer activity history
   * 
   * @param id - Customer ID
   * @param options - Operation options with optional auth context
   * @returns Customer history records
   */
  getCustomerHistory(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<Array<{
    type: string;
    timestamp: Date;
    details?: string;
  }>>;
  
  /**
   * Add a note to a customer record
   * 
   * @param customerId - Customer ID
   * @param text - Note text
   * @param userId - User adding the note
   * @param name - User name
   * @param options - Operation options with auth context
   * @returns Promise indicating successful note addition
   * @throws {ErrorDetails} When note addition fails
   */
  addNote(
    customerId: number, 
    text: string, 
    userId: number, 
    name: string, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<void>;
  
  /**
   * Advanced customer search with comprehensive filtering
   * 
   * @param filters - Complex customer filter parameters
   * @param options - Operation options
   * @returns Paginated customer results
   */
  findAll(
    filters: CustomerFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<CustomerResponseDto>>;
  
  /**
   * Export customer data
   * 
   * @param filters - Optional filter parameters
   * @param format - Export format
   * @param options - Operation options with auth context
   * @returns Exported data buffer and filename
   */
  exportData(
    filters: CustomerFilterParams, 
    format?: 'csv' | 'excel', 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<{ buffer: Buffer; filename: string }>;
  
  /**
   * Perform advanced customer search
   * 
   * @param searchTerm - Search query
   * @param options - Operation options
   * @returns Paginated customer search results
   */
  searchCustomers(
    searchTerm: string, 
    options?: OperationOptions
  ): Promise<PaginatedResult<CustomerResponseDto>>;
  
  /**
   * Permanently remove a customer from the system
   * 
   * @param id - Customer ID
   * @param options - Operation options with auth context
   * @returns Deleted customer response
   * @throws {ErrorDetails} When deletion fails
   */
  hardDelete(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<CustomerResponseDto>;
}
