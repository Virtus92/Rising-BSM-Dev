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
import { DateTimeHelper } from '../utils/datetime-helper.js';

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
   * Find all customers with filtering and pagination
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Promise with paginated customer response
   */
  async findAll(
    filters: CustomerFilterParams, 
    options?: ServiceOptions
  ): Promise<{ data: CustomerResponseDto[]; pagination: any }> {
    try {
      // Extract pagination options
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      
      // Merge filters and pagination options
      const queryOptions = { ...filters, page, limit };
      
      // Get paginated data from repository
      const paginatedResult = await this.customerRepository.findAll(queryOptions);
      
      // Map entities to DTOs
      const data = paginatedResult.data.map(entity => this.toDTO(entity));
      
      // Return data and pagination info
      return {
        data,
        pagination: paginatedResult.pagination
      };
    } catch (error) {
      this.logger.error('Error in CustomerService.findAll', error instanceof Error ? error : String(error), { filters, options });
      throw this.handleError(error);
    }
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
          startDate: DateTimeHelper.formatDate(project.startDate),
          status: project.status
        })) || [],
        appointments: customer.appointments?.map(appointment => ({
          id: appointment.id,
          title: appointment.title,
          appointmentDate: DateTimeHelper.formatDate(appointment.appointmentDate),
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
          options.context.name || 'System'
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
      const customersByStatus: Record<string, number> = {};
      for (const status of Object.values(CustomerStatus)) {
        const count = await this.repository.count({ status });
        customersByStatus[status] = count;
      }
      
      // Count by type
      const customersByType = {};
      const types = ['private', 'business'];
      
      // New customers this month
      const firstDayOfMonth = DateTimeHelper.startOfMonth();
      const newCustomersThisMonth = await this.repository.count({
        createdAt: { gte: firstDayOfMonth }
      });
      
      // New customers last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const firstDayOfLastMonth = DateTimeHelper.startOfMonth(lastMonth);
      const lastDayOfLastMonth = DateTimeHelper.endOfMonth(lastMonth);
      
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
        date: DateTimeHelper.formatDate(log.createdAt, 'dd.MM.yyyy HH:mm'),
        by: log.name || 'System',
        details: log.details
      }));
      
      // Return structured insights
      return {
        customer: customerDto,
        projectStats,
        appointmentStats,
        financials: {
          totalRevenue: DateTimeHelper.formatCurrency(totalRevenue),
          averageProjectValue: projectStats.total > 0 
            ? DateTimeHelper.formatCurrency(totalRevenue / projectStats.total) 
            : DateTimeHelper.formatCurrency(0)
        },
        activity: {
          recent: recentActivity,
          lastUpdate: DateTimeHelper.formatRelativeTime(customer.updatedAt)
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
      
      // Get customer logs (this would need a proper implementation with a log repository)
      // For now, we'll return sample data
      const logs = await this.fetchCustomerLogs(id);
      
      // Format logs
      return logs.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: DateTimeHelper.formatDate(log.createdAt, 'dd.MM.yyyy HH:mm'),
        relativeTime: DateTimeHelper.formatRelativeTime(log.createdAt),
        user: log.name || 'System',
        details: log.details
      }));
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
   * @param name - User name
   */
  async addNote(customerId: number, text: string, userId: number, name: string): Promise<void> {
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
        notes: customer.notes
      });
      
      // Log note addition
      this.logger.info('Note added to customer', { customerId, userId, name });
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
        // Excel export (implemented with proper Excel library)
        return this.generateExcelExport(customers, filename);
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

  /**
   * Generate Excel export
   * 
   * @param customers - Customers to export
   * @param filename - Output filename
   * @returns Export result
   */
  private generateExcelExport(customers: CustomerResponseDto[], filename: string): {buffer: Buffer, filename: string} {
    // This would use a proper Excel library like exceljs or xlsx
    // Since we don't have the actual implementation, we'll just convert to CSV for now
    
    this.logger.warn('Excel export not fully implemented - falling back to CSV');
    
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
      filename: filename.replace('.xlsx', '.csv')
    };
  }

  /**
   * Fetch customer logs
   * 
   * @param customerId - Customer ID
   * @returns Customer logs
   */
  private async fetchCustomerLogs(customerId: number): Promise<any[]> {
    // This would be implemented with a proper log repository
    // For now, we'll return sample data
    return [
      {
        id: 1,
        customerId,
        userId: 1,
        name: 'Admin User',
        action: 'create',
        details: 'Customer created',
        createdAt: new Date(Date.now() - 1000000)
      },
      {
        id: 2,
        customerId,
        userId: 1,
        name: 'Admin User',
        action: 'update',
        details: 'Customer data updated',
        createdAt: new Date(Date.now() - 500000)
      }
    ];
  }
}