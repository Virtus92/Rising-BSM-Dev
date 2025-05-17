'use client';

import { CustomerClient } from '../clients/CustomerClient';
import { ApiResponse } from '@/core/api/ApiClient';
import { CommonStatus } from '@/domain/enums/CommonEnums';
import { 
  CustomerResponseDto, 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerFilterParamsDto,
  CustomerLogDto 
} from '@/domain/dtos/CustomerDtos';

import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ICustomerService } from '@/domain/services/ICustomerService';

/**
 * Client-side Customer Service
 * Provides both static convenience methods and instance methods that implement the ICustomerService interface
 * 
 * Implementation of ICustomerService interface for client-side use.
 */
export class CustomerService implements ICustomerService {
  // Add instance methods to implement ICustomerService interface
  
  async findByEmail(email: string, options?: any): Promise<CustomerResponseDto | null> {
    const response = await CustomerClient.findCustomerByEmail(email);
    return response.success && response.data ? response.data : null;
  }

  async getCustomerDetails(id: number, options?: any): Promise<any> {
    const response = await CustomerClient.getCustomer(id);
    return response.success && response.data ? response.data : null;
  }

  async count(options?: any): Promise<number> {
    const response = await CustomerClient.getCustomerCount();
    // Ensure we always return a number, not null
    return response.success && response.data != null ? response.data : 0;
  }

  async getAll(options?: any): Promise<PaginationResult<CustomerResponseDto>> {
    const response = await CustomerClient.getCustomers(options);
    // Ensure we always return a valid pagination result, not null
    return response.success && response.data != null 
      ? response.data 
      : { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  async getById(id: number, options?: any): Promise<CustomerResponseDto | null> {
    const response = await CustomerClient.getCustomer(id);
    return response.success && response.data ? response.data : null;
  }

  async create(data: CreateCustomerDto, options?: any): Promise<CustomerResponseDto> {
    const response = await CustomerClient.createCustomer(data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create customer');
    }
    return response.data;
  }

  async update(id: number, data: UpdateCustomerDto, options?: any): Promise<CustomerResponseDto> {
    const response = await CustomerClient.updateCustomer(id, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update customer');
    }
    return response.data;
  }

  async updateStatus(id: number, statusData: any, options?: any): Promise<CustomerResponseDto> {
    const response = await CustomerClient.updateCustomerStatus(id, statusData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update customer status');
    }
    return response.data;
  }

  async delete(id: number, options?: any): Promise<boolean> {
    const response = await CustomerClient.deleteCustomer(id);
    return response.success;
  }

  async addNote(id: number, note: string, options?: any): Promise<CustomerLogDto> {
    const response = await CustomerClient.addCustomerNote(id, { note });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to add note');
    }
    return response.data;
  }

  async getNotes(id: number, options?: any): Promise<CustomerLogDto[]> {
    const response = await CustomerClient.getCustomerNotes(id);
    return response.success && response.data ? response.data : [];
  }

  async findByCriteria(criteria: Record<string, any>, options?: any): Promise<CustomerResponseDto[]> {
    const response = await CustomerClient.getCustomers(criteria);
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    }
    return [];
  }

  async validate(data: any, isUpdate?: boolean, entityId?: number): Promise<any> {
    // Client-side validation is limited - consider using server validation
    return { isValid: true, result: 'SUCCESS', errors: null };
  }

  async search(searchText: string, options?: any): Promise<CustomerResponseDto[]> {
    const response = await CustomerClient.getCustomers({ search: searchText });
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    }
    return [];
  }

  async exists(id: number, options?: any): Promise<boolean> {
    const response = await CustomerClient.getCustomer(id);
    return response.success && response.data != null;
  }

  getRepository(): any {
    // Client-side doesn't have direct repository access
    throw new Error('Repository access not available on client-side');
  }

  async transaction<T>(callback: (service: ICustomerService) => Promise<T>): Promise<T> {
    // Client-side doesn't support transactions
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: UpdateCustomerDto, options?: any): Promise<number> {
    // Implement client-side bulk update if needed
    let updateCount = 0;
    for (const id of ids) {
      try {
        await this.update(id, data, options);
        updateCount++;
      } catch (error) {
        console.error(`Failed to update customer ${id}:`, error);
      }
    }
    return updateCount;
  }

  async findCustomers(filters: CustomerFilterParamsDto, options?: any): Promise<PaginationResult<CustomerResponseDto>> {
    const response = await CustomerClient.getCustomers(filters);
    return response.success && response.data 
      ? response.data 
      : { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  async searchCustomers(searchText: string, options?: any): Promise<CustomerResponseDto[]> {
    const result = await this.search(searchText, options);
    return result; // This ensures we return a non-null CustomerResponseDto[]
  }

  async getSimilarCustomers(customerId: number, options?: any): Promise<CustomerResponseDto[]> {
    // Implement if API supports this
    return [];
  }
  
  /**
   * Get customer statistics
   */
  async getCustomerStatistics(options?: any): Promise<any> {
    // Implement client-side customer statistics retrieval
    try {
      // Use available API endpoints to compute statistics client-side
      const countResponse = await CustomerClient.getCustomerCount();
      const count = countResponse.success && countResponse.data != null ? countResponse.data : 0;
      
      // Return basic statistics that can be computed client-side
      return {
        totalCustomers: count,
        // Add other statistics if available through existing client methods
      };
    } catch (error) {
      console.error('Failed to get customer statistics:', error);
      return {};
    }
  }
  
  /**
   * Get customer logs
   */
  async getCustomerLogs(customerId: number, options?: any): Promise<CustomerLogDto[]> {
    return this.getNotes(customerId, options);
  }
  
  /**
   * Create a customer log entry
   */
  async createCustomerLog(customerId: number, action: string, details?: string, options?: any): Promise<CustomerLogDto> {
    const note = `${action}: ${details || ''}`;
    return this.addNote(customerId, note, options);
  }
  
  /**
   * Soft delete a customer
   */
  async softDelete(customerId: number, options?: any): Promise<boolean> {
    return this.delete(customerId, options);
  }
  
  /**
   * Hard delete a customer
   */
  async hardDelete(customerId: number, options?: any): Promise<boolean> {
    const options2 = { ...(options || {}), hardDelete: true };
    return this.delete(customerId, options2);
  }
  
  /**
   * Export customers
   */
  async exportCustomers(filters: CustomerFilterParamsDto, format: string, options?: any): Promise<Buffer> {
    try {
      // In client-side implementation, we can't directly return a Buffer
      // Instead, we'll throw an informative error directing users to use a different approach
      
      // In a real implementation, we would:
      // 1. Make an API call to a dedicated export endpoint
      // 2. Trigger a download in the browser
      
      throw new Error('Client-side export to Buffer not supported - use the export API endpoint directly via URL');
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Export failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Update newsletter subscription for a customer
   */
  async updateNewsletterSubscription(customerId: number, subscribe: boolean, options?: any): Promise<CustomerResponseDto> {
    try {
      // Create a minimal update payload with just the newsletter subscription data
      // This assumes the UpdateCustomerDto has a way to update newsletter subscription
      const updateData: UpdateCustomerDto = {
        // Using type assertion to bypass property checks
        // In a real implementation, make sure UpdateCustomerDto has the appropriate fields
        newsletterSubscribed: subscribe,
      } as UpdateCustomerDto;
      
      // Update the customer with the newsletter subscription status
      const response = await CustomerClient.updateCustomer(customerId, updateData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update newsletter subscription');
      }
      
      return response.data;
    } catch (error) {
      console.error('Newsletter subscription update error:', error);
      throw new Error('Failed to update subscription: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Convert entity to DTO
   */
  toDTO(entity: any): CustomerResponseDto {
    // Client-side doesn't have direct entity-to-DTO conversion
    return entity as CustomerResponseDto;
  }
  
  /**
   * Convert DTO to entity
   */
  fromDTO(dto: any): any {
    // Client-side doesn't have direct DTO-to-entity conversion
    return dto;
  }
  
  /**
   * Find all entries with pagination
   */
  async findAll(options?: any): Promise<PaginationResult<CustomerResponseDto>> {
    return this.getAll(options);
  }
  
  // Add any other methods required by the interface
  /**
   * Get a customer by ID
   */
  static async getCustomerById(id: number): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      const response = await CustomerClient.getCustomer(id);
      return {
        success: true,
        error: null,
        data: response.data 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer',
        message: error instanceof Error ? error.message : 'Failed to fetch customer',
        data: null
      };
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(data: CreateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      const response = await CustomerClient.createCustomer(data);
      return {
        success: true,
        error: null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        
        error: error instanceof Error ? error.message : 'Failed to fetch customer',
        message: error instanceof Error ? error.message : 'Failed to create customer',
        data: null
      };
    }
  }

  /**
   * Update a customer
   */
  static async updateCustomer(id: number, data: UpdateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      const response = await CustomerClient.updateCustomer(id, data);
      return {
        success: true,
        error: null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer',
        message: error instanceof Error ? error.message : 'Failed to update customer',
        data: null
      };
    }
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(id: number): Promise<ApiResponse<boolean>> {
    try {
      const response = await CustomerClient.deleteCustomer(id);
      return {
        success: true,
        error: null,
        data: response.data ?? true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer',
        message: error instanceof Error ? error.message : 'Failed to delete customer',
        data: null
      };
    }
  }

  /**
   * Get customers with filtering and pagination
   */
  static async getCustomers(params?: CustomerFilterParamsDto): Promise<ApiResponse<PaginationResult<CustomerResponseDto>>> {
    try {
      const response = await CustomerClient.getCustomers(params);
      return {
        success: true,
        error: null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customers',
        message: error instanceof Error ? error.message : 'Failed to fetch customers',
        data: null
      };
    }
  }

  /**
   * Update customer status
   */
  static async updateStatus(id: number, status: CommonStatus): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      const response = await CustomerClient.updateCustomerStatus(id, { status });
      return {
        success: true,
        error: null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer status',
        message: error instanceof Error ? error.message : 'Failed to update customer status',
        data: null
      };
    }
  }

  /**
   * Add a note to a customer
   */
  static async addNote(customerId: number, note: string): Promise<ApiResponse<CustomerLogDto>> {
    try {
      const response = await CustomerClient.addCustomerNote(customerId, { note });
      return {
        success: true,
        error: null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add note',
        message: error instanceof Error ? error.message : 'Failed to add note',
        data: null
      };
    }
  }

  /**
   * Get customer notes
   */
  static async getNotes(customerId: number): Promise<ApiResponse<CustomerLogDto[]>> {
    try {
      const response = await CustomerClient.getCustomerNotes(customerId);
      return {
        success: true,
        error: null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
        message: error instanceof Error ? error.message : 'Failed to fetch notes',
        data: null
      };
    }
  }

  /**
   * Add customer note (alias for addNote)
   */
  static async addCustomerNote(customerId: number, note: string): Promise<ApiResponse<CustomerLogDto>> {
    return CustomerService.addNote(customerId, note);
  }

  /**
   * Get customer notes (alias for getNotes)
   */
  static async getCustomerNotes(customerId: number): Promise<ApiResponse<CustomerLogDto[]>> {
    return CustomerService.getNotes(customerId, );
  }

  /**
   * Count customers with optional filters
   */
  static async count(filters?: Record<string, any>): Promise<ApiResponse<number>> {
    try {
      const response = await CustomerClient.getCustomerCount();
      return {
        success: true,
        error: null,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to count customers',
        message: error instanceof Error ? error.message : 'Failed to count customers',
        data: null
      };
    }
  }
}
