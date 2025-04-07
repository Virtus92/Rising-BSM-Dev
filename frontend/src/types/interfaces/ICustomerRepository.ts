import { IBaseRepository } from './IBaseRepository';
import { Customer } from '../entities/customer/customer';
import { CustomerFilterParams } from '../dtos/customer-dto';
import { 
  PaginatedResult, 
  OperationOptions,
  FilterCriteria,
  ErrorDetails 
} from '@/types/core/shared';

export interface ICustomerRepository extends IBaseRepository<Customer, number, CustomerFilterParams> {
  /**
   * Find customers similar to a given customer
   * 
   * @param customerId - Base customer ID
   * @param limit - Maximum number of similar customers
   * @returns Similar customer entities
   */
  findSimilarCustomers(
    customerId: number, 
    limit?: number
  ): Promise<Customer[]>;
  
  /**
   * Advanced customer search
   * 
   * @param term - Search term
   * @param limit - Maximum number of results
   * @returns Matching customer entities
   */
  searchCustomers(
    term: string, 
    limit?: number
  ): Promise<Customer[]>;
  
  /**
   * Find customers with advanced filtering
   * 
   * @param filters - Complex customer filter parameters
   * @param options - Query options
   * @returns Paginated customer results
   */
  findUsers(
    filters: CustomerFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<Customer>>;
  
  /**
   * Retrieve customer with detailed relations
   * 
   * @param id - Customer ID
   * @param options - Query options
   * @returns Customer entity with related data or null
   */
  findByIdWithRelations(
    id: number, 
    options?: OperationOptions
  ): Promise<Customer | null>;

  /**
   * Create a customer log entry
   * 
   * @param data - Log data
   * @returns Created log entry
   */
  createCustomerLog(
    data: {
      customerId: number;
      userId?: number;
      action: string;
      details?: string;
    }
  ): Promise<{
    id: number;
    customerId: number;
    userId?: number;
    action: string;
    details?: string;
    createdAt: Date;
  }>;

  /**
   * Permanently remove customer from database
   * 
   * @param id - Customer ID
   * @returns Deletion result
   */
  hardDelete(id: number): Promise<boolean>;

  /**
   * Retrieve customer logs
   * 
   * @param customerId - Customer ID
   * @returns Customer log entries
   */
  getCustomerLogs(
    customerId: number
  ): Promise<Array<{
    id: number;
    customerId: number;
    userId?: number;
    action: string;
    details?: string;
    createdAt: Date;
  }>>;
}
