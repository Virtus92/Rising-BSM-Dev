import { IBaseService } from './IBaseService.js';
import { Customer } from '../entities/Customer.js';
import { 
  CustomerCreateDto, 
  CustomerUpdateDto, 
  CustomerResponseDto, 
  CustomerDetailResponseDto,
  CustomerFilterParams,
  CustomerStatusUpdateDto
} from '../dtos/CustomerDtos.js';
import { ServiceOptions } from './IBaseService.js';

/**
 * ICustomerService
 * 
 * Service interface for Customer entity operations.
 * Extends the base service interface with customer-specific methods.
 */
export interface ICustomerService extends IBaseService<Customer, CustomerCreateDto, CustomerUpdateDto, CustomerResponseDto> {
  /**
   * Get detailed customer information
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Promise with detailed customer response
   */
  getCustomerDetails(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null>;
  
  /**
   * Update customer status
   * 
   * @param statusUpdateDto - Status update data
   * @param options - Service options
   * @returns Promise with updated customer response
   */
  updateStatus(statusUpdateDto: CustomerStatusUpdateDto, options?: ServiceOptions): Promise<CustomerResponseDto>;
  
  /**
   * Get customer statistics
   * 
   * @returns Promise with customer statistics
   */
  getCustomerStatistics(): Promise<any>;
  
  /**
   * Get customer insights with detailed analytics
   * 
   * @param id - Customer ID
   * @returns Promise with customer insights
   */
  getCustomerInsights(id: number): Promise<any>;
  
  /**
   * Find all customers with filtering and pagination
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Promise with paginated customer data
   */
  findAll(filters: CustomerFilterParams, options?: ServiceOptions): Promise<{data: CustomerResponseDto[], pagination: any}>;

  /**
   * Find similar customers based on attributes
   * 
   * @param id - Customer ID
   * @param limit - Maximum number of customers to return
   * @returns Promise with similar customers
   */
  findSimilarCustomers(id: number, limit?: number): Promise<CustomerResponseDto[]>;
  
  /**
   * Get customer activity history
   * 
   * @param id - Customer ID
   * @returns Promise with customer history
   */
  getCustomerHistory(id: number): Promise<any[]>;
  
  /**
   * Add note to customer
   * 
   * @param customerId - Customer ID
   * @param text - Note text
   * @param userId - User ID
   * @param userName - User name
   * @returns Promise indicating success
   */
  addNote(customerId: number, text: string, userId: number, userName: string): Promise<void>;
  
  /**
   * Bulk update multiple customers
   * 
   * @param ids - Array of customer IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Promise with count of updated customers
   */
  bulkUpdate(ids: number[], data: CustomerUpdateDto, options?: ServiceOptions): Promise<number>;
  
  /**
   * Export customer data
   * 
   * @param filters - Filter parameters
   * @param format - Export format (csv or excel)
   * @returns Promise with export result
   */
  exportData(filters: CustomerFilterParams, format?: string): Promise<{buffer: Buffer, filename: string}>;
  
  /**
   * Search customers with advanced filtering
   * 
   * @param searchTerm - Search term
   * @param options - Service options
   * @returns Promise with paginated search results
   */
  searchCustomers(searchTerm: string, options?: ServiceOptions): Promise<{data: CustomerResponseDto[], pagination: any}>;
  
  /**
   * Hard delete a customer (permanent deletion)
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Promise with deleted customer
   */
  hardDelete(id: number, options?: any): Promise<CustomerResponseDto>;
}