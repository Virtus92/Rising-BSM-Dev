import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerResponseDto, 
  CustomerDetailResponseDto,
  UpdateCustomerStatusDto,
  CustomerFilterParamsDto,
  CustomerLogDto
} from '@/domain/dtos/CustomerDtos';
import { ICustomerService } from '@/domain/services/ICustomerService';
import { Customer } from '@/domain/entities/Customer';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions } from '@/domain/services/IBaseService';

/**
 * Service for managing customers
 */
export class CustomerService implements ICustomerService {
  /**
   * Constructor
   * 
   * @param customerRepository - Customer repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   */
  constructor(
    public readonly customerRepository: ICustomerRepository,
    public readonly logger: ILoggingService,
    public readonly validator: IValidationService,
    public readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized CustomerService');
  }
  
  /**
   * Gets the repository instance
   * This allows direct repository access when needed for specific operations
   * 
   * @returns The repository instance
   */
  public getRepository(): ICustomerRepository {
    return this.customerRepository;
  }

  /**
   * Finds a customer by email
   * 
   * @param email - Email address
   * @param options - Service options
   * @returns Found customer or null
   */
  async findByEmail(email: string, options?: ServiceOptions): Promise<CustomerResponseDto | null> {
    try {
      const customer = await this.customerRepository.findOneByCriteria({ email });
      if (!customer) return null;
      
      return this.mapToResponseDto(customer);
    } catch (error) {
      this.logger.error('Error in CustomerService.findByEmail', { error, email });
      throw error;
    }
  }
  
  /**
   * Gets detailed customer information
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Detailed customer information or null
   */
  async getCustomerDetails(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null> {
    try {
      const customer = await this.customerRepository.findById(id);
      if (!customer) return null;
      
      // Create the detailed response DTO
      const detailsDto: CustomerDetailResponseDto = {
        ...this.mapToResponseDto(customer),
        // Additional fields would be added here in a complete implementation
      };
      
      return detailsDto;
    } catch (error) {
      this.logger.error('Error in CustomerService.getCustomerDetails', { error, id });
      throw error;
    }
  }
  
  /**
   * Finds customers with advanced filtering options
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Found customers with pagination
   */
  async findCustomers(filters: CustomerFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    try {
      // For now, just return all customers with simple pagination
      const customers = await this.customerRepository.findAll();
      const customerList = Array.isArray(customers) ? customers : [];
      
      return {
        data: customerList.map(customer => this.mapToResponseDto(customer)),
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: customerList.length,
          totalPages: Math.ceil(customerList.length / (filters.limit || 10))
        }
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.findCustomers', { error, filters });
      throw error;
    }
  }
  
  /**
   * Updates a customer's status
   * 
   * @param customerId - Customer ID
   * @param data - Status change data
   * @param options - Service options
   * @returns Updated customer
   */
  async updateStatus(customerId: number, data: UpdateCustomerStatusDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw this.errorHandler.createNotFoundError('Customer not found');
      }
      
      const updatedCustomer = { ...customer };
      updatedCustomer.status = data.status;
      
      const result = await this.customerRepository.update(customerId, updatedCustomer);
      
      return this.mapToResponseDto(result);
    } catch (error) {
      this.logger.error('Error in CustomerService.updateStatus', { error, customerId, data });
      throw error;
    }
  }
  
  /**
   * Searches for customers by search term
   * 
   * @param searchText - Search term
   * @param options - Service options
   * @returns Found customers
   */
  async searchCustomers(searchText: string, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    try {
      const customers = await this.customerRepository.findAll();
      const customerList = Array.isArray(customers) ? customers : [];
      
      const filteredCustomers = customerList.filter(customer => 
        customer.name.toLowerCase().includes(searchText.toLowerCase()) || 
        (customer.email && customer.email.toLowerCase().includes(searchText.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchText))
      );
      
      return filteredCustomers.map(customer => this.mapToResponseDto(customer));
    } catch (error) {
      this.logger.error('Error in CustomerService.searchCustomers', { error, searchText });
      throw error;
    }
  }
  
  /**
   * Gets similar customers
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Similar customers
   */
  async getSimilarCustomers(customerId: number, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw this.errorHandler.createNotFoundError('Customer not found');
      }
      
      // Implementation would find similar customers based on various criteria
      // For this implementation, we'll just return an empty array
      return [];
    } catch (error) {
      this.logger.error('Error in CustomerService.getSimilarCustomers', { error, customerId });
      throw error;
    }
  }
  
  /**
   * Gets customer statistics
   * 
   * @param options - Service options
   * @returns Customer statistics
   */
  async getCustomerStatistics(options?: ServiceOptions): Promise<any> {
    try {
      // Implementation would fetch statistics from repository
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        newCustomersThisMonth: 0
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.getCustomerStatistics', { error });
      throw error;
    }
  }
  
  /**
   * Gets customer logs
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Customer logs
   */
  async getCustomerLogs(customerId: number, options?: ServiceOptions): Promise<CustomerLogDto[]> {
    try {
      // For now, return an empty array - would be implemented in a complete version
      return [];
    } catch (error) {
      this.logger.error('Error in CustomerService.getCustomerLogs', { error, customerId });
      throw error;
    }
  }
  
  /**
   * Creates a log entry for a customer
   * 
   * @param customerId - Customer ID
   * @param action - Action
   * @param details - Details
   * @param options - Service options
   * @returns Created log entry
   */
  async createCustomerLog(
    customerId: number, 
    action: string, 
    details?: string, 
    options?: ServiceOptions
  ): Promise<CustomerLogDto> {
    try {
      // Try to get customer to get name
      const customer = await this.customerRepository.findById(customerId);
      const customerName = customer ? customer.name : 'Unknown';
      
      // Minimal implementation - would be more complete in production
      return {
        id: 0,
        customerId,
        customerName,
        entityType: EntityType.CUSTOMER, // Required field for CustomerLogDto
        entityId: customerId,   // Required field for CustomerLogDto
        action,
        details: details ? { text: details } : { text: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.createCustomerLog', { error, customerId, action });
      throw error;
    }
  }
  
  /**
   * Performs a soft delete of a customer
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Success of the operation
   */
  async softDelete(customerId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw this.errorHandler.createNotFoundError('Customer not found');
      }
      
      // Perform soft delete
      const updatedCustomer = { ...customer };
      updatedCustomer.status = CommonStatus.INACTIVE;
      
      await this.customerRepository.update(customerId, updatedCustomer);
      
      return true;
    } catch (error) {
      this.logger.error('Error in CustomerService.softDelete', { error, customerId });
      throw error;
    }
  }
  
  /**
   * Exports customers
   * 
   * @param filters - Filter parameters
   * @param format - Export format (e.g. 'csv', 'xlsx')
   * @param options - Service options
   * @returns Export data
   */
  async exportCustomers(filters: CustomerFilterParamsDto, format: string, options?: ServiceOptions): Promise<Buffer> {
    try {
      // This would normally generate the export data
      // For this implementation, we'll just return an empty buffer
      return Buffer.from('');
    } catch (error) {
      this.logger.error('Error in CustomerService.exportCustomers', { error, filters, format });
      throw error;
    }
  }
  
  /**
   * Updates a customer's newsletter subscription
   * 
   * @param customerId - Customer ID
   * @param subscribe - Subscribe to newsletter
   * @param options - Service options
   * @returns Updated customer
   */
  async updateNewsletterSubscription(customerId: number, subscribe: boolean, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw this.errorHandler.createNotFoundError('Customer not found');
      }
      
      const updatedCustomer = { ...customer, newsletter: subscribe };
      const result = await this.customerRepository.update(customerId, updatedCustomer);
      
      return this.mapToResponseDto(result);
    } catch (error) {
      this.logger.error('Error in CustomerService.updateNewsletterSubscription', { error, customerId, subscribe });
      throw error;
    }
  }

  /**
   * Creates a new customer
   * 
   * @param data - Customer creation data
   * @param options - Service options
   * @returns Created customer
   */
  async create(data: CreateCustomerDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      const customer = await this.customerRepository.create(data);
      return this.mapToResponseDto(customer);
    } catch (error) {
      this.logger.error('Error in CustomerService.create', { error, data });
      throw error;
    }
  }

  /**
   * Updates a customer
   * 
   * @param id - Customer ID
   * @param data - Customer update data
   * @param options - Service options
   * @returns Updated customer
   */
  async update(id: number, data: UpdateCustomerDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      const customer = await this.customerRepository.update(id, data);
      return this.mapToResponseDto(customer);
    } catch (error) {
      this.logger.error('Error in CustomerService.update', { error, id, data });
      throw error;
    }
  }

  /**
   * Deletes a customer
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Success of the operation
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      await this.customerRepository.delete(id);
      return true;
    } catch (error) {
      this.logger.error('Error in CustomerService.delete', { error, id });
      throw error;
    }
  }

  /**
   * Gets all customers
   * 
   * @param options - Service options
   * @returns All customers with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    try {
      const customers = await this.customerRepository.findAll();
      const customerList = Array.isArray(customers) ? customers : [];
      
      return {
        data: customerList.map(customer => this.mapToResponseDto(customer)),
        pagination: {
          page: 1,
          limit: customerList.length,
          total: customerList.length,
          totalPages: 1
        }
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.getAll', { error });
      throw error;
    }
  }

  /**
   * Gets a customer by ID
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Found customer or null
   */
  async getById(id: number, options?: ServiceOptions): Promise<CustomerResponseDto | null> {
    try {
      const customer = await this.customerRepository.findById(id);
      if (!customer) return null;
      
      return this.mapToResponseDto(customer);
    } catch (error) {
      this.logger.error('Error in CustomerService.getById', { error, id });
      throw error;
    }
  }

  /**
   * Maps a Customer entity to a CustomerResponseDto
   * 
   * @param customer - Customer entity
   * @returns CustomerResponseDto
   */
  public mapToResponseDto(customer: Customer): CustomerResponseDto {
    return this.toDTO(customer);
  }

  /**
   * Maps a domain entity to a DTO
   * 
   * @param entity - Domain entity
   * @returns DTO
   */
  public toDTO(entity: Customer): CustomerResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      company: entity.company,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      postalCode: entity.postalCode,
      city: entity.city,
      country: entity.country || 'Deutschland',
      type: entity.type,
      newsletter: entity.newsletter,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /** 
   * Additional BaseService methods
   */
  /**
   * Maps a DTO to a domain entity
   * 
   * @param dto - DTO
   * @returns Domain entity
   */
  public fromDTO(dto: any): Customer {
    return new Customer({
      id: dto.id,
      name: dto.name,
      company: dto.company,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      postalCode: dto.postalCode,
      city: dto.city,
      country: dto.country,
      type: dto.type,
      newsletter: dto.newsletter,
      status: dto.status,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    });
  }

  /**
   * Searches for customers
   * 
   * @param term - Search term
   * @param options - Service options
   * @returns Search results
   */
  async search(term: string, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    return this.searchCustomers(term, options);
  }

  /**
   * Checks if a customer exists by ID
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Whether the customer exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.customerRepository.findById(id);
      return !!result;
    } catch (error) {
      this.logger.error('Error in CustomerService.exists', { error, id });
      throw error;
    }
  }
  
  /**
   * Checks if a customer exists by criteria
   * 
   * @param criteria - Search criteria
   * @param options - Service options
   * @returns Whether the customer exists
   */
  async existsByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.customerRepository.findOneByCriteria(criteria);
      return !!result;
    } catch (error) {
      this.logger.error('Error in CustomerService.existsByCriteria', { error, criteria });
      throw error;
    }
  }
  
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    try {
      const customers = await this.customerRepository.findByCriteria(criteria);
      return customers.map(customer => this.mapToResponseDto(customer));
    } catch (error) {
      this.logger.error('Error in CustomerService.findByCriteria', { error, criteria });
      throw error;
    }
  }

  async validate(data: any, schema: any): Promise<any> {
    return this.validator.validate(data, schema);
  }

  async transaction<T>(callback: (service: any) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: Partial<Customer>): Promise<number> {
    // Not implemented yet
    return 0;
  }
}
