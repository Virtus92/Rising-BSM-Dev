import { IBaseRepository } from './IBaseRepository.js';
import { Customer } from '../entities/Customer.js';
import { CustomerFilterParams } from '../dtos/CustomerDtos.js';

/**
 * ICustomerRepository
 * 
 * Repository interface for Customer entity operations.
 * Extends the base repository interface with customer-specific methods.
 */
export interface ICustomerRepository extends IBaseRepository<Customer, number> {
  /**
   * Find customers with similar attributes
   * 
   * @param customerId - Customer ID
   * @param limit - Maximum number of customers to return
   * @returns Promise with similar customers
   */
  findSimilarCustomers(customerId: number, limit?: number): Promise<Customer[]>;
  
  /**
   * Search customers with advanced filtering
   * 
   * @param term - Search term
   * @param limit - Maximum number of customers to return
   * @returns Promise with matching customers
   */
  searchCustomers(term: string, limit?: number): Promise<Customer[]>;
  
  /**
   * Bulk update multiple customers
   * 
   * @param ids - Array of customer IDs
   * @param data - Update data
   * @returns Promise with count of updated customers
   */
  bulkUpdate(ids: number[], data: Partial<Customer>): Promise<number>;
  
  /**
   * Get customer by ID with related data
   * 
   * @param id - Customer ID
   * @param options - Query options
   * @returns Promise with customer including related data
   */
  findByIdWithRelations(id: number, options?: any): Promise<Customer | null>;
}