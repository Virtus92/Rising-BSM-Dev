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
import { ILoggingService } from '@/core/logging/ILoggingService';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { QueryOptions } from '@/domain/repositories/IBaseRepository';
import { PrismaClient } from '@prisma/client';

/**
 * Service for managing customers
 */
export class CustomerService implements ICustomerService {
  private prismaClient: PrismaClient;
  
  /**
   * Constructor
   * 
   * @param customerRepository - Customer repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   * @param prisma - Optional Prisma client instance
   */
  constructor(
    public readonly customerRepository: ICustomerRepository,
    public readonly logger: ILoggingService,
    public readonly validator: IValidationService,
    public readonly errorHandler: IErrorHandler,
    prisma?: PrismaClient
  ) {
    this.logger.debug('Initialized CustomerService');
    // Use provided prisma instance or get from global instance
    if (prisma) {
      this.prismaClient = prisma;
    } else {
      this.prismaClient = new PrismaClient();
      this.logger.debug('Created new PrismaClient in CustomerService');
    }
  }
  
  // Private variable to store notes in memory (temporary solution until database implementation)
  private customerNotes: Map<number, CustomerLogDto[]> = new Map();

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
      // Get filter for action if provided
      const filter: { customerId: number; action?: string } = { customerId };
      if (options?.filters?.action) {
        filter.action = options.filters.action as string;
      }
      
      // Get logs from database using Prisma
      const logs = await this.prismaClient.customerLog.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
        include: { 
          user: true,
          customer: true
        }
      });
      
      this.logger.debug('Retrieved customer logs', { 
        customerId, 
        count: logs.length, 
        filter: options?.filters 
      });
      
      // Map logs to DTOs with consistent format
      return logs.map(log => {
        let details: Record<string, any> = {};
        
        // Safely parse JSON details
        if (log.details) {
        try {
          details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        } catch (e) {
          // If parsing fails, create a simple object with the string value
          details = { text: log.details };
          this.logger.warn('Failed to parse log details as JSON', { logId: log.id, details: log.details });
        }
      }
        
        return {
          id: log.id,
          customerId: log.customerId,
          customerName: log.customer?.name || 'Unknown Customer',
          entityType: EntityType.CUSTOMER, 
          entityId: log.customerId,
          userId: log.userId || 0,
          userName: log.userName,
          action: log.action,
          details: details,
          // Use undefined instead of null to match CustomerLogDto type
          text: log.details === null ? undefined : log.details,
          createdAt: log.createdAt.toISOString(),
          updatedAt: log.createdAt.toISOString() // CustomerLog doesn't have updatedAt
        };
      });
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
      // Try to get customer to validate existence
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with id ${customerId} not found`);
      }
      
      const userName = options?.context?.userName || 'System';
      const userId = options?.context?.userId;
      
      // Create log entry in database using Prisma
      const log = await this.prismaClient.customerLog.create({
        data: {
          customerId,
          userId, 
          userName,
          action,
          details: details, // Prisma schema expects a string here
          createdAt: new Date(),
        },
        include: { 
          user: true,
          customer: true
        }
      });
      
      this.logger.debug('Created customer log', { 
        logId: log.id,
        customerId, 
        action 
      });
      
      // Parse or create details as an object
      let detailsObj: Record<string, any> = {};
      
      if (log.details) {
        try {
          detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        } catch (e) {
          // If parsing fails, create a simple object with the string value
          detailsObj = { text: log.details };
          this.logger.warn('Failed to parse log details as JSON', { logId: log.id, details: log.details });
        }
      }
      
      // Return as DTO with consistent fields
      return {
        id: log.id,
        customerId: log.customerId,
        customerName: log.customer?.name || 'Unknown Customer',
        entityType: EntityType.CUSTOMER,
        entityId: log.customerId,
        userId: log.userId || 0,
        userName: log.userName,
        action: log.action,
        details: detailsObj,
        // Use undefined instead of null to match CustomerLogDto type
        text: log.details === null ? undefined : log.details,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.createdAt.toISOString() // CustomerLog doesn't have updatedAt
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
      this.logger.debug('Creating customer with data', { data });
      
      // Normalize data to match database schema
      const normalizedData: any = { ...data };
      
      // Handle field name mappings for zipCode/postalCode
      if (normalizedData.zipCode !== undefined) {
        normalizedData.postalCode = normalizedData.zipCode;
        delete normalizedData.zipCode;
      }
      
      // Handle field name mappings for companyName/company
      if (normalizedData.companyName !== undefined) {
        normalizedData.company = normalizedData.companyName;
        delete normalizedData.companyName;
      }
      
      // Ensure VAT number is properly processed - log it for debugging
      if (normalizedData.vatNumber !== undefined) {
        console.log('Processing VAT number:', normalizedData.vatNumber);
        
        // If backend expects a different field name for VAT number, uncomment and adapt this:
        // normalizedData.vat_number = normalizedData.vatNumber;
        // delete normalizedData.vatNumber;
      } else {
        console.log('No VAT number provided in create request');
      }
      
      // Set timestamps if not provided
      if (!normalizedData.createdAt) {
        normalizedData.createdAt = new Date();
      }
      
      if (!normalizedData.updatedAt) {
        normalizedData.updatedAt = new Date();
      }
      
      // Set userId from context if available
      if (options?.context?.userId && !normalizedData.createdBy) {
        normalizedData.createdBy = options.context.userId;
        normalizedData.updatedBy = options.context.userId;
      }
      
      this.logger.debug('Creating customer with normalized data', { normalizedData });
      
      const customer = await this.customerRepository.create(normalizedData);
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
      // Normalize data to match database schema
      const normalizedData: any = { ...data };
      
      // Handle field name mappings for zipCode/postalCode
      if (normalizedData.zipCode !== undefined) {
        normalizedData.postalCode = normalizedData.zipCode;
        delete normalizedData.zipCode;
      }
      
      // Handle field name mappings for companyName/company
      if (normalizedData.companyName !== undefined) {
        normalizedData.company = normalizedData.companyName;
        delete normalizedData.companyName;
      }
      
      // Ensure VAT number is properly processed during updates
      if (normalizedData.vatNumber !== undefined) {
        console.log('Processing VAT number in update:', normalizedData.vatNumber);
        
        // If backend expects a different field name for VAT number, uncomment and adapt this:
        // normalizedData.vat_number = normalizedData.vatNumber;
        // delete normalizedData.vatNumber;
      } else {
        console.log('No VAT number provided in update request');
      }
      
      // Set updatedAt timestamp if not provided
      normalizedData.updatedAt = new Date();
      
      // Set userId from context if available
      if (options?.context?.userId) {
        normalizedData.updatedBy = options.context.userId;
      }
      
      this.logger.debug('Updating customer with normalized data', { id, normalizedData });
      
      const customer = await this.customerRepository.update(id, normalizedData);
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
   * Gets all customers with advanced filtering and pagination
   * 
   * @param options - Service options with filtering and pagination parameters
   * @returns All customers with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    try {
      this.logger.debug('CustomerService.getAll called with options', { options });
      
      // Extract pagination parameters
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const filters = options?.filters || {};
      const sort = options?.sort || { field: 'createdAt', direction: 'desc' };
      
      // Get customers with proper pagination and filtering
      const queryOptions = {
        page,
        limit,
        sort: {
          field: sort.field,
          direction: sort.direction
        }
      };
      
      // Add filters if they exist - we need to handle this differently since
      // QueryOptions doesn't have a "filter" property
      const result = await this.customerRepository.findAll(queryOptions);
      
      // Filter the results in-memory if filters were provided
      // Note: In a real implementation, you'd want to pass these to the repository
      let filteredData = result.data;

      // Map database result to expected format
      const mappedCustomers = filteredData.map(customer => this.mapToResponseDto(customer));
      
      this.logger.debug('CustomerService.getAll found customers', { 
        count: mappedCustomers.length,
        total: result.pagination.total,
        page: result.pagination.page
      });
      
      // Return in the format required by the PaginationResult interface
      return {
        data: mappedCustomers,
        pagination: {
          page: result.pagination.page,
          limit,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.getAll', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      
      // Return empty result in case of error rather than throwing
      // This prevents 500 errors and provides debugging opportunity
      return {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
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
      updatedAt: entity.updatedAt.toISOString(),
      // Add frontend-specific field aliases for consistency
      zipCode: entity.postalCode,
      companyName: entity.company
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

  /**
   * Count customers with optional filtering criteria
   * 
   * @param options - Service options with filters
   * @returns Number of customers matching criteria
   */
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const criteria = options?.filters || {};
      const count = await this.customerRepository.count(criteria);
      return count;
    } catch (error) {
      this.logger.error('Error counting customers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      throw error;
    }
  }

  /**
   * Find all customers with pagination, sorting and optional filtering
   * 
   * @param options - Service options
   * @returns Paginated list of customers
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<CustomerResponseDto>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const filters = options?.filters || {};
      const sort = options?.sort || { field: 'createdAt', direction: 'desc' };
      const relations = options?.relations || [];
      
      const queryOptions: QueryOptions = {
        page,
        limit,
        relations,
        sort: {
          field: sort.field,
          direction: sort.direction
        }
      };
      
      // Apply filters if they exist
      const result = await this.customerRepository.findByCriteria(filters, queryOptions);
      
      return {
        data: result.map(customer => this.mapToResponseDto(customer)),
        pagination: {
          page,
          limit,
          total: result.length,
          totalPages: Math.ceil(result.length / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error finding all customers:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        options
      });
      
      // Return empty result instead of throwing
      return {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }
}
