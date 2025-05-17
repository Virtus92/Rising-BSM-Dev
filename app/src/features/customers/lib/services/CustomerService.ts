'use client';

import { ICustomerService } from '@/domain/services/ICustomerService';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { Customer } from '@/domain/entities/Customer';
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerResponseDto, 
  CustomerDetailResponseDto,
  UpdateCustomerStatusDto,
  CustomerFilterParamsDto,
  CustomerLogDto
} from '@/domain/dtos/CustomerDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { CustomerClient } from '../clients/CustomerClient';

/**
 * Client-side service for managing customers
 * This is a lightweight client service that delegates to the API client
 */
export class CustomerService implements ICustomerService {
  private repository: any;
  
  public async getRepository(): Promise<any> {
    return this.repository;
  }

  /**
   * Creates a new customer
   */
  public async create(data: CreateCustomerDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    const response = await CustomerClient.createCustomer(data);
    if (!response || !response.data) {
      throw new Error('Failed to create customer');
    }
    return response.data;
  }

  /**
   * Updates a customer
   */
  public async update(id: number, data: UpdateCustomerDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    const response = await CustomerClient.updateCustomer(id, data);
    if (!response || !response.data) {
      throw new Error('Failed to update customer');
    }
    return response.data;
  }

  /**
   * Deletes a customer
   */
  public async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    const response = await CustomerClient.deleteCustomer(id);
    return response.success;
  }

  /**
   * Finds a customer by ID
   */
  public async findById(id: number, options?: ServiceOptions): Promise<CustomerResponseDto | null> {
    try {
      const response = await CustomerClient.getCustomer(id);
      return response.data || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Finds all customers
   */
  public async findAll(options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    const params: CustomerFilterParamsDto = {
      page: options?.page || 1,
      limit: options?.limit || 10
    };
    const response = await CustomerClient.getCustomers(params);
    if (!response || !response.data) {
      throw new Error('Failed to get customers');
    }
    return response.data;
  }

  /**
   * Get all entities with pagination
   */
  public async getAll(options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    return this.findAll(options);
  }

  /**
   * Get an entity by ID
   */
  public async getById(id: number, options?: ServiceOptions): Promise<CustomerResponseDto | null> {
    return this.findById(id, options);
  }

  /**
   * Find entities matching criteria
   */
  public async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    // Since the client doesn't have direct access to the database,
    // we simulate this by using the search API
    const searchText = Object.values(criteria).join(' ');
    return this.searchCustomers(searchText, options);
  }

  /**
   * Count entities
   */
  public async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    const result = await this.findAll({ page: 1, limit: 1 } as ServiceOptions);
    return result.total || 0;
  }

  /**
   * Check if an entity exists
   */
  public async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const customer = await this.findById(id, options);
      return customer !== null;
    } catch {
      return false;
    }
  }

  /**
   * Search for entities
   */
  public async search(searchText: string, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    return this.searchCustomers(searchText, options);
  }

  /**
   * Validate data
   */
  public async validate(data: CreateCustomerDto | UpdateCustomerDto, isUpdate?: boolean, entityId?: number): Promise<any> {
    // Client-side validation placeholder
    return { valid: true, errors: {} };
  }

  /**
   * Execute a transaction
   */
  public async transaction<R>(callback: (service: ICustomerService) => Promise<R>): Promise<R> {
    // Transactions are handled server-side
    return callback(this);
  }

  /**
   * Bulk update entities
   */
  public async bulkUpdate(ids: number[], data: UpdateCustomerDto, options?: ServiceOptions): Promise<number> {
    // Not implemented on client side
    throw new Error('Bulk update not supported on client side');
  }

  /**
   * Convert entity to DTO
   */
  public toDTO(entity: Customer): CustomerResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone || undefined,
      address: entity.address || undefined,
      city: entity.city || undefined,
      postalCode: entity.postalCode || undefined,
      country: entity.country,
      newsletter: entity.newsletter || false,
      status: entity.status || CommonStatus.ACTIVE,
      type: entity.type || CustomerType.PRIVATE,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Convert DTO to entity
   */
  public fromDTO(dto: CreateCustomerDto | UpdateCustomerDto): Partial<Customer> {
    const result: Partial<Customer> = {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      postalCode: dto.postalCode,
      country: dto.country,
      status: dto.status,
      type: dto.type,
      newsletter: dto.newsletter,
      state: dto.state,
      notes: dto.notes,
      vatNumber: dto.vatNumber
    };
    
    // Add timestamps
    if ('createdAt' in dto && dto.createdAt) {
      result.createdAt = new Date(dto.createdAt);
    }
    if ('updatedAt' in dto && dto.updatedAt) {
      result.updatedAt = new Date(dto.updatedAt);
    }
    
    return result;
  }

  /**
   * Finds a customer by email
   */
  public async findByEmail(email: string, options?: ServiceOptions): Promise<CustomerResponseDto | null> {
    const params: CustomerFilterParamsDto = {
      page: 1,
      limit: 1,
      search: email
    };
    const result = await CustomerClient.getCustomers(params);
    if (!result || !result.data) {
      return null;
    }
    // Handle both array and paginated response formats
    const customers = Array.isArray(result.data) ? result.data : result.data.data;
    return customers?.find(c => c.email === email) || null;
  }

  /**
   * Gets customer details
   */
  public async getCustomerDetails(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null> {
    // Use the standard get method which includes details
    const customer = await this.findById(id, options);
    return customer as CustomerDetailResponseDto;
  }

  /**
   * Finds customers with filtering
   */
  public async findCustomers(filters: CustomerFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    const response = await CustomerClient.getCustomers(filters);
    if (!response || !response.data) {
      throw new Error('Failed to find customers');
    }
    return response.data;
  }

  /**
   * Updates customer status
   */
  public async updateStatus(customerId: number, data: UpdateCustomerStatusDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    const response = await CustomerClient.updateCustomerStatus(customerId, data);
    if (!response || !response.data) {
      throw new Error('Failed to update customer status');
    }
    return response.data;
  }

  /**
   * Searches customers
   */
  public async searchCustomers(searchText: string, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    const params: CustomerFilterParamsDto = {
      page: 1,
      limit: 10,
      search: searchText
    };
    const result = await CustomerClient.getCustomers(params);
    if (!result || !result.data) {
      return [];
    }
    // Handle both array and paginated response formats
    return Array.isArray(result.data) ? result.data : result.data.data || [];
  }

  /**
   * Gets similar customers
   */
  public async getSimilarCustomers(customerId: number, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    // Not implemented on client side
    return [];
  }

  /**
   * Gets customer statistics
   */
  public async getCustomerStatistics(options?: ServiceOptions): Promise<any> {
    // Not implemented on client side
    return {};
  }

  /**
   * Gets customer logs
   */
  public async getCustomerLogs(customerId: number, options?: ServiceOptions): Promise<CustomerLogDto[]> {
    const response = await CustomerClient.getCustomerLogs(customerId);
    if (!response || !response.data) {
      return [];
    }
    return response.data;
  }

  /**
   * Creates a customer log
   */
  public async createCustomerLog(customerId: number, action: string, details?: string, options?: ServiceOptions): Promise<CustomerLogDto> {
    const response = await CustomerClient.createCustomerLog(customerId, { action, details });
    if (!response || !response.data) {
      throw new Error('Failed to create customer log');
    }
    return response.data;
  }

  /**
   * Soft deletes a customer
   */
  public async softDelete(customerId: number, options?: ServiceOptions): Promise<boolean> {
    const response = await CustomerClient.deleteCustomer(customerId);
    return response.success;
  }

  /**
   * Hard deletes a customer (permanent)
   */
  public async hardDelete(customerId: number, options?: ServiceOptions): Promise<boolean> {
    // Not supported on client side for safety
    throw new Error('Hard delete not supported on client side');
  }

  /**
   * Exports customers
   */
  public async exportCustomers(filters: CustomerFilterParamsDto, format: string, options?: ServiceOptions): Promise<Buffer> {
    // Not implemented on client side
    throw new Error('Export not supported on client side');
  }

  /**
   * Updates newsletter subscription
   */
  public async updateNewsletterSubscription(customerId: number, subscribe: boolean, options?: ServiceOptions): Promise<CustomerResponseDto> {
    return this.update(customerId, { newsletter: subscribe } as UpdateCustomerDto, options);
  }
}
