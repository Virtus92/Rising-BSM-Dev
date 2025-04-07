/**
 * CustomerService
 * Service implementation for customer operations
 */
import { CustomerRepository } from '../repositories/CustomerRepository';
import { BaseService } from '../lib/core/BaseService';
import { ILoggingService } from '@/types/interfaces/ILoggingService';
import { IValidationService } from '@/types/interfaces/IValidationService';
import { IErrorHandler } from '@/types/interfaces/IErrorHandler';
import { ICustomer, CustomerStatus, CustomerType } from '@/types/entities/customer/customer';
import { ServiceOptions } from '@/types/interfaces/IService';

// Import DTOs
import { 
  CreateCustomerDto, 
  UpdateCustomerDto, 
  CustomerResponseDto,
  CustomerDetailResponseDto,
  CustomerFilterParams,
  CustomerStatusUpdateDto
} from '@/types/dtos/customer-dto';

/**
 * CustomerService
 */
export class CustomerService extends BaseService<ICustomer, CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto> {
  /**
   * Creates a new CustomerService instance
   * 
   * @param customerRepository - Repository for data access
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private customerRepository: CustomerRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(customerRepository, logger, validator, errorHandler);
    this.logger.debug('CustomerService initialized');
  }

  /**
   * Get customer with detailed information including related entities
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Promise with detailed customer response
   */
  async getCustomerDetails(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null> {
    try {
      this.logger.debug('Getting customer details', { id });
      
      // Get customer with relations from repository
      const customer = await this.customerRepository.findByIdWithRelations(id);
      
      if (!customer) {
        return null;
      }
      
      // Map to response DTO
      const customerDto = this.toDTO(customer);
      
      // Create detailed response with related entities
      const detailDto: CustomerDetailResponseDto = {
        ...customerDto,
        projects: customer.projects?.map(project => ({
          id: project.id,
          title: project.title,
          startDate: project.startDate ? new Date(project.startDate).toISOString() : undefined,
          status: project.status
        })) || [],
        appointments: customer.appointments?.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString() : undefined,
          status: appointment.status
        })) || []
      };
      
      return detailDto;
    } catch (error) {
      this.logger.error('Error getting customer details', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Find similar customers based on attributes
   * 
   * @param id - Customer ID
   * @param limit - Maximum number of customers to return
   * @returns Promise with similar customers
   */
  async findSimilarCustomers(id: number, limit: number = 5): Promise<CustomerResponseDto[]> {
    try {
      this.logger.debug('Finding similar customers', { id, limit });
      
      // Get similar customers from repository
      const similarCustomers = await this.customerRepository.findSimilarCustomers(id, limit);
      
      // Map to response DTOs
      return similarCustomers.map(customer => this.toDTO(customer));
    } catch (error) {
      this.logger.error('Error finding similar customers', error instanceof Error ? error : String(error), { id, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Search customers with advanced filtering
   * 
   * @param searchTerm - Search term
   * @param options - Service options
   * @returns Promise with search results
   */
  async searchCustomers(searchTerm: string, options?: ServiceOptions): Promise<CustomerResponseDto[]> {
    try {
      this.logger.debug('Searching customers', { searchTerm });
      
      // Get limit from options or use default
      const limit = options?.limit || 20;
      
      // Search customers using repository
      const customers = await this.customerRepository.searchCustomers(searchTerm, limit);
      
      // Map to response DTOs
      return customers.map(customer => this.toDTO(customer));
    } catch (error) {
      this.logger.error('Error searching customers', error instanceof Error ? error : String(error), { searchTerm });
      throw this.handleError(error);
    }
  }

  /**
   * Update customer status
   * 
   * @param id - Customer ID
   * @param status - New status
   * @param options - Service options
   * @returns Promise with updated customer
   */
  async updateStatus(id: number, status: CustomerStatus, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      this.logger.debug('Updating customer status', { id, status });
      
      // Check if customer exists
      const customer = await this.getById(id);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Validate status
      if (!Object.values(CustomerStatus).includes(status)) {
        throw this.errorHandler.createValidationError(
          'Invalid status',
          [`Status must be one of: ${Object.values(CustomerStatus).join(', ')}`]
        );
      }
      
      // Update customer status
      const updatedCustomer = await this.update(id, { status }, options);
      
      // Create a log entry for the status change
      await this.customerRepository.createCustomerLog({
        customerId: id,
        userId: options?.context?.userId,
        action: 'status_changed',
        details: `Status changed from ${customer.status} to ${status}`
      });
      
      return updatedCustomer;
    } catch (error) {
      this.logger.error('Error updating customer status', error instanceof Error ? error : String(error), { id, status });
      throw this.handleError(error);
    }
  }

  /**
   * Get customer activity logs
   * 
   * @param id - Customer ID
   * @returns Promise with customer logs
   */
  async getCustomerLogs(id: number): Promise<any[]> {
    try {
      this.logger.debug('Getting customer logs', { id });
      
      // Check if customer exists
      const customer = await this.getById(id);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Get logs from repository
      const logs = await this.customerRepository.getCustomerLogs(id);
      
      // Format logs for API response
      return logs.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.createdAt.toISOString(),
        user: log.userName,
        details: log.details
      }));
    } catch (error) {
      this.logger.error('Error getting customer logs', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Add a log entry for a customer
   * 
   * @param customerId - Customer ID
   * @param action - Log action
   * @param details - Log details
   * @param userId - User ID
   * @returns Promise with created log
   */
  async addCustomerLog(customerId: number, action: string, details: string, userId?: number): Promise<any> {
    try {
      this.logger.debug('Adding customer log', { customerId, action });
      
      // Check if customer exists
      const customer = await this.getById(customerId);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${customerId} not found`);
      }
      
      // Create log entry
      return await this.customerRepository.createCustomerLog({
        customerId,
        userId,
        action,
        details
      });
    } catch (error) {
      this.logger.error('Error adding customer log', error instanceof Error ? error : String(error), { customerId, action });
      throw this.handleError(error);
    }
  }

  /**
   * Map entity to DTO
   */
  toDTO(entity: ICustomer): CustomerResponseDto {
    if (!entity) return null;
    
    return {
      id: entity.id,
      name: entity.name,
      company: entity.company,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      postalCode: entity.postalCode,
      city: entity.city,
      country: entity.country,
      notes: entity.notes,
      newsletter: entity.newsletter,
      status: entity.status,
      type: entity.type,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy
    };
  }

  /**
   * Get validation schema for create operations
   */
  protected getCreateValidationSchema(): any {
    return {
      name: {
        type: 'string',
        required: true,
        min: 2,
        max: 100,
        messages: {
          required: 'Name is required',
          min: 'Name must be at least 2 characters',
          max: 'Name cannot exceed 100 characters'
        }
      },
      email: {
        type: 'email',
        required: false,
        messages: {
          email: 'Invalid email format'
        }
      },
      phone: {
        type: 'string',
        required: false,
        max: 30,
        messages: {
          max: 'Phone number cannot exceed 30 characters'
        }
      },
      company: {
        type: 'string',
        required: false,
        max: 100,
        messages: {
          max: 'Company name cannot exceed 100 characters'
        }
      },
      type: {
        type: 'string',
        enum: Object.values(CustomerType),
        required: false,
        default: CustomerType.PRIVATE,
        messages: {
          enum: `Type must be one of: ${Object.values(CustomerType).join(', ')}`
        }
      }
    };
  }

  /**
   * Get validation schema for update operations
   */
  protected getUpdateValidationSchema(): any {
    return {
      name: {
        type: 'string',
        required: false,
        min: 2,
        max: 100,
        messages: {
          min: 'Name must be at least 2 characters',
          max: 'Name cannot exceed 100 characters'
        }
      },
      email: {
        type: 'email',
        required: false,
        messages: {
          email: 'Invalid email format'
        }
      },
      phone: {
        type: 'string',
        required: false,
        max: 30,
        messages: {
          max: 'Phone number cannot exceed 30 characters'
        }
      },
      company: {
        type: 'string',