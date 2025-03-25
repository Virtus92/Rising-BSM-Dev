import { BaseService } from '../core/BaseService.js';
import { ICustomerService } from '../interfaces/ICustomerService.js';
import { ICustomerRepository } from '../interfaces/ICustomerRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { Customer, CustomerStatus } from '../entities/Customer.js';
import { 
  CustomerCreateDto, 
  CustomerUpdateDto, 
  CustomerResponseDto,
  CustomerDetailResponseDto,
  CustomerFilterParams,
  CustomerStatusUpdateDto,
  customerCreateValidationSchema,
  customerUpdateValidationSchema,
  getCustomerStatusLabel,
  getCustomerStatusClass,
  getCustomerTypeLabel
} from '../dtos/CustomerDtos.js';
import { ServiceOptions } from '../interfaces/IBaseService.js';

/**
 * Implementation of ICustomerService
 */
export class CustomerService extends BaseService<
  Customer, 
  CustomerCreateDto, 
  CustomerUpdateDto, 
  CustomerResponseDto
> implements ICustomerService {
  /**
   * Creates a new CustomerService instance
   * 
   * @param customerRepository - Customer repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly customerRepository: ICustomerRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(customerRepository, logger, validator, errorHandler);
  }

  /**
   * Get detailed customer information
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Promise with detailed customer response
   */
  async getCustomerDetails(id: number, options?: ServiceOptions): Promise<CustomerDetailResponseDto | null> {
    try {
      // Get customer with related data
      const customer = await this.customerRepository.findByIdWithRelations(id);
      
      if (!customer) {
        return null;
      }
      
      // Map to basic DTO
      const customerDto = this.toDTO(customer);
      
      // Create detailed DTO with related data
      const detailDto: CustomerDetailResponseDto = {
        ...customerDto,
        projects: customer.projects?.map(project => ({
          id: project.id,
          title: project.title,
          startDate: this.formatDate(project.startDate),
          status: project.status
        })) || [],
        appointments: customer.appointments?.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          appointmentDate: this.formatDate(appointment.appointmentDate),
          status: appointment.status
        })) || []
      };
      
      return detailDto;
    } catch (error) {
      this.logger.error('Error in CustomerService.getCustomerDetails', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Update customer status
   * 
   * @param statusUpdateDto - Status update data
   * @param options - Service options
   * @returns Promise with updated customer response
   */
  async updateStatus(statusUpdateDto: CustomerStatusUpdateDto, options?: ServiceOptions): Promise<CustomerResponseDto> {
    try {
      const { id, status, note } = statusUpdateDto;
      
      // Get customer
      const customer = await this.repository.findById(id);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Update status
      const updatedCustomer = await this.update(id, { status }, options);
      
      // Add note if provided
      if (note && options?.context?.userId) {
        await this.addNote(
          id,
          note,
          options.context.userId,
          options.context.userName || 'System'
        );
      }
      
      return updatedCustomer;
    } catch (error) {
      this.logger.error('Error in CustomerService.updateStatus', error instanceof Error ? error : String(error), { statusUpdateDto });
      throw this.handleError(error);
    }
  }

  /**
   * Get customer statistics
   * 
   * @returns Promise with customer statistics
   */
  async getCustomerStatistics(): Promise<any> {
    try {
      // Count all customers
      const totalCustomers = await this.repository.count();
      
      // Count by status
      const customersByStatus = {};
      for (const status of Object.values(CustomerStatus)) {
        const count = await this.repository.count({ status });
        customersByStatus[status] = count;
      }
      
      // Count by type
      const customersByType = {};
      const types = ['privat', 'geschaeft'];
      for (const type of types) {
        const count = await this.repository.count({ type });
        customersByType[type] = count;
      }
      
      // New customers this month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const newCustomersThisMonth = await this.repository.count({
        createdAt: { gte: firstDayOfMonth }
      });
      
      // New customers last month
      const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const newCustomersLastMonth = await this.repository.count({
        createdAt: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth
        }
      });
      
      // Calculate growth rate
      const growthRate = newCustomersLastMonth > 0
        ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100
        : 100;
      
      return {
        total: totalCustomers,
        byStatus: customersByStatus,
        byType: customersByType,
        trend: {
          thisMonth: newCustomersThisMonth,
          lastMonth: newCustomersLastMonth,
          growthRate: parseFloat(growthRate.toFixed(2))
        }
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.getCustomerStatistics', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get customer insights with detailed analytics
   * 
   * @param id - Customer ID
   * @returns Promise with customer insights
   */
  async getCustomerInsights(id: number): Promise<any> {
    try {
      // Get customer with related data
      const customer = await this.customerRepository.findByIdWithRelations(id);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Map to DTO
      const customerDto = this.toDTO(customer);
      
      // Project statistics
      const projectStats = {
        total: customer.projects?.length || 0,
        byStatus: customer.projects?.reduce((stats, project) => {
          stats[project.status] = (stats[project.status] || 0) + 1;
          return stats;
        }, {} as Record<string, number>) || {}
      };
      
      // Appointment statistics
      const appointmentStats = {
        total: customer.appointments?.length || 0,
        upcoming: customer.appointments?.filter(a => 
          new Date(a.appointmentDate) > new Date()
        ).length || 0
      };
      
      // Calculate revenue from projects
      const totalRevenue = customer.projects?.reduce((sum, project) => 
        sum + (project.amount ? Number(project.amount) : 0), 0
      ) || 0;
      
      // Get recent activity logs
      const recentLogs = customer.logs || []; // This would need to be fetched from a log repository
      
      // Format activity logs
      const recentActivity = recentLogs.map(log => ({
        action: log.action,
        date: this.formatDate(log.createdAt, 'dd.MM.yyyy HH:mm'),
        by: log.userName || 'System',
        details: log.details
      }));
      
      // Return structured insights
      return {
        customer: customerDto,
        projectStats,
        appointmentStats,
        financials: {
          totalRevenue: this.formatCurrency(totalRevenue),
          averageProjectValue: projectStats.total > 0 
            ? this.formatCurrency(totalRevenue / projectStats.total) 
            : this.formatCurrency(0)
        },
        activity: {
          recent: recentActivity,
          lastUpdate: this.formatRelativeTime(customer.updatedAt)
        }
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.getCustomerInsights', error instanceof Error ? error : String(error), { id });
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
      // Use repository to find similar customers
      const similarCustomers = await this.customerRepository.findSimilarCustomers(id, limit);
      
      // Map to DTOs
      return similarCustomers.map(customer => this.toDTO(customer));
    } catch (error) {
      this.logger.error('Error in CustomerService.findSimilarCustomers', error instanceof Error ? error : String(error), { id, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Get customer activity history
   * 
   * @param id - Customer ID
   * @returns Promise with customer history
   */
  async getCustomerHistory(id: number): Promise<any[]> {
    try {
      // Check if customer exists
      const customer = await this.repository.findById(id);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${id} not found`);
      }
      
      // This would need to be implemented with a proper log repository
      // For now, return a placeholder
      return [
        {
          id: 1,
          action: 'Customer created',
          timestamp: this.formatDate(customer.createdAt, 'dd.MM.yyyy HH:mm'),
          relativeTime: this.formatRelativeTime(customer.createdAt),
          user: 'System',
          details: 'Initial customer record created'
        },
        {
          id: 2,
          action: 'Customer updated',
          timestamp: this.formatDate(customer.updatedAt, 'dd.MM.yyyy HH:mm'),
          relativeTime: this.formatRelativeTime(customer.updatedAt),
          user: 'System',
          details: 'Customer information updated'
        }
      ];
    } catch (error) {
      this.logger.error('Error in CustomerService.getCustomerHistory', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Add note to customer
   * 
   * @param customerId - Customer ID
   * @param text - Note text
   * @param userId - User ID
   * @param userName - User name
   */
  async addNote(customerId: number, text: string, userId: number, userName: string): Promise<void> {
    try {
      // Get customer
      const customer = await this.repository.findById(customerId);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${customerId} not found`);
      }
      
      // Add note to customer
      customer.addNote(text);
      
      // Update customer
      await this.repository.update(customerId, {
        notes: customer.notes,
        updatedBy: userId
      });
      
      // Log note addition (would require a proper log repository)
      this.logger.info('Note added to customer', { customerId, userId, userName });
    } catch (error) {
      this.logger.error('Error in CustomerService.addNote', error instanceof Error ? error : String(error), { customerId, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Bulk update multiple customers
   * 
   * @param ids - Array of customer IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Promise with count of updated customers
   */
  async bulkUpdate(ids: number[], data: CustomerUpdateDto, options?: ServiceOptions): Promise<number> {
    try {
      // Validate data
      await this.validate(data, true);
      
      // Use repository for bulk update
      return await this.customerRepository.bulkUpdate(ids, data as Partial<Customer>);
    } catch (error) {
      this.logger.error('Error in CustomerService.bulkUpdate', error instanceof Error ? error : String(error), { ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Export customer data
   * 
   * @param filters - Filter parameters
   * @param format - Export format (csv or excel)
   * @returns Promise with export result
   */
  async exportData(filters: CustomerFilterParams, format: string = 'csv'): Promise<{buffer: Buffer, filename: string}> {
    try {
      // Get filtered customers
      const { data: customers } = await this.findAll(filters);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `customers-export-${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      if (format === 'csv') {
        // Generate CSV content
        const headers = 'ID,Name,Email,Phone,Company,PostalCode,City,Status,Type,Newsletter\n';
        const rows = customers.map(customer => {
          return [
            customer.id,
            this.escapeCsvValue(customer.name),
            this.escapeCsvValue(customer.email || ''),
            this.escapeCsvValue(customer.phone || ''),
            this.escapeCsvValue(customer.company || ''),
            this.escapeCsvValue(customer.postalCode || ''),
            this.escapeCsvValue(customer.city || ''),
            this.escapeCsvValue(customer.status),
            this.escapeCsvValue(customer.type),
            customer.newsletter ? 'Yes' : 'No'
          ].join(',');
        }).join('\n');
        
        const csvContent = headers + rows;
        return {
          buffer: Buffer.from(csvContent),
          filename
        };
      } else {
        // Excel export would require additional libraries
        throw this.errorHandler.createError('Excel export not implemented yet', 501);
      }
    } catch (error) {
      this.logger.error('Error in CustomerService.exportData', error instanceof Error ? error : String(error), { filters, format });
      throw this.handleError(error);
    }
  }

  /**
   * Search customers with advanced filtering
   * 
   * @param searchTerm - Search term
   * @param options - Service options
   * @returns Promise with paginated search results
   */
  async searchCustomers(searchTerm: string, options?: ServiceOptions): Promise<{data: CustomerResponseDto[], pagination: any}> {
    try {
      // Extract pagination from options
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      
      // Search customers
      const customers = await this.customerRepository.searchCustomers(searchTerm, limit);
      
      // Create pagination info
      const pagination = {
        current: page,
        limit,
        total: customers.length,
        totalPages: Math.ceil(customers.length / limit)
      };
      
      // Map to DTOs
      const data = customers.map(customer => this.toDTO(customer));
      
      return { data, pagination };
    } catch (error) {
      this.logger.error('Error in CustomerService.searchCustomers', error instanceof Error ? error : String(error), { searchTerm });
      throw this.handleError(error);
    }
  }

  /**
   * Hard delete a customer (permanent deletion)
   * 
   * @param id - Customer ID
   * @param options - Service options
   * @returns Promise with deleted customer
   */
  async hardDelete(id: number, options?: any): Promise<CustomerResponseDto> {
    try {
      // Get customer first to return proper data if successful
      const customer = await this.repository.findById(id);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Map to DTO before deletion
      const customerDto = this.toDTO(customer);
      
      // Perform hard delete (this would need to be implemented in the repository)
      // For now, just mark as deleted
      await this.update(id, { status: CustomerStatus.DELETED });
      
      return customerDto;
    } catch (error) {
      this.logger.error('Error in CustomerService.hardDelete', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Map entity to response DTO
   * 
   * @param entity - Customer entity
   * @returns Customer response DTO
   */
  toDTO(entity: Customer): CustomerResponseDto {
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
      status: entity.status,
      type: entity.type,
      newsletter: entity.newsletter,
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Get validation schema for create operation
   * 
   * @returns Validation schema
   */
  protected getCreateValidationSchema(): any {
    return customerCreateValidationSchema;
  }

  /**
   * Get validation schema for update operation
   * 
   * @returns Validation schema
   */
  protected getUpdateValidationSchema(): any {
    return customerUpdateValidationSchema;
  }

  /**
   * Map DTO to entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(dto: CustomerCreateDto | CustomerUpdateDto, existingEntity?: Customer): Partial<Customer> {
    if (existingEntity) {
      // Update operation - return only the fields to update
      return dto as CustomerUpdateDto;
    } else {
      // Create operation
      return {
        ...dto as CustomerCreateDto,
        status: CustomerStatus.ACTIVE
      };
    }
  }

  /**
   * Format a date
   * 
   * @param date - Date to format
   * @param format - Format string
   * @returns Formatted date
   */
  private formatDate(date: Date | string, format: string = 'yyyy-MM-dd'): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Simple formatting for now
    return d.toISOString().split('T')[0];
  }

  /**
   * Format relative time
   * 
   * @param date - Date to format
   * @returns Formatted relative time
   */
  private formatRelativeTime(date: Date | string): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Format currency
   * 
   * @param amount - Amount to format
   * @returns Formatted currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Escape CSV value
   * 
   * @param value - Value to escape
   * @returns Escaped value
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    // If value contains comma, double quote, or newline, wrap in quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Replace double quotes with two double quotes
      value = value.replace(/"/g, '""');
      return `"${value}"`;
    }
    
    return value;
  }
}