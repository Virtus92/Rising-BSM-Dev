import { Request, Response } from 'express';
import { ICustomerController } from '../interfaces/ICustomerController.js';
import { ICustomerService } from '../interfaces/ICustomerService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  CustomerCreateDto, 
  CustomerUpdateDto, 
  CustomerStatusUpdateDto,
  CustomerNoteCreateDto,
  CustomerFilterParams
} from '../dtos/CustomerDtos.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';

/**
 * Implementation of ICustomerController
 */
export class CustomerController implements ICustomerController {
  /**
   * Creates a new CustomerController instance
   * 
   * @param customerService - Customer service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly customerService: ICustomerService,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized CustomerController');
  }

  /**
   * Get all customers with pagination and filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getAllCustomers(req: Request, res: Response): Promise<void> {
    try {
      // Get validated query params or use raw query
      const query = (req as any).validatedQuery || req.query;
      
      // Build filter parameters
      const filters: CustomerFilterParams = {
        search: query.search as string,
        status: query.status as string,
        type: query.type as string,
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
        sortBy: query.sortBy as string || 'createdAt',
        sortDirection: (query.sortDirection as 'asc' | 'desc') || 'desc',
        city: query.city as string,
        postalCode: query.postalCode as string,
        newsletter: query.newsletter !== undefined ? Boolean(query.newsletter) : undefined,
        startDate: query.startDate ? new Date(query.startDate as string) : undefined,
        endDate: query.endDate ? new Date(query.endDate as string) : undefined
      };
      
      // Get customers from service
      const result = await this.customerService.findAll(filters);
      
      // Send paginated response
      this.sendPaginatedResponse(res, result.data, result.pagination, 'Customers retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get customer by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get detailed customer data
      const customer = await this.customerService.getCustomerDetails(id);
      
      if (!customer) {
        throw this.errorHandler.createNotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Send success response
      this.sendSuccessResponse(res, customer, 'Customer retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Create a new customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerData = (req as any).validatedData as CustomerCreateDto || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Create customer with user context
      const customer = await this.customerService.create(customerData, {
        context: {
          userId: authReq.user?.id,
          ipAddress: req.ip
        }
      });
      
      // Send created response
      this.sendCreatedResponse(res, customer, 'Customer created successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Update an existing customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const customerData = (req as any).validatedData as CustomerUpdateDto || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Update customer with user context
      const customer = await this.customerService.update(id, customerData, {
        context: {
          userId: authReq.user?.id,
          userName: authReq.user?.name,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(res, customer, 'Customer updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Delete a customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async deleteCustomer(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const authReq = req as AuthenticatedRequest;
      const hardDelete = req.query.mode === 'hard';
      
      let result;
      
      if (hardDelete) {
        // Use hard delete when specified
        result = await this.customerService.hardDelete(id, {
          context: {
            userId: authReq.user?.id,
            ipAddress: req.ip
          }
        });
      } else {
        // Default to soft delete
        result = await this.customerService.delete(id, {
          context: {
            userId: authReq.user?.id,
            softDelete: true
          }
        });
      }
      
      // Send success response
      this.sendSuccessResponse(
        res,
        { success: true, id, mode: hardDelete ? 'hard' : 'soft' },
        `Customer ${hardDelete ? 'permanently ' : ''}deleted successfully`
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Update customer status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async updateCustomerStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, note } = (req as any).validatedData as CustomerStatusUpdateDto || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Create status update DTO
      const statusUpdateDto: CustomerStatusUpdateDto = {
        id,
        status,
        note
      };
      
      // Update status
      const customer = await this.customerService.updateStatus(statusUpdateDto, {
        context: {
          userId: authReq.user?.id,
          userName: authReq.user?.name,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(res, customer, 'Customer status updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Add a note to customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async addCustomerNote(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { text } = (req as any).validatedData as CustomerNoteCreateDto || req.body;
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      // Add note
      await this.customerService.addNote(
        id,
        text,
        authReq.user.id,
        authReq.user.name
      );
      
      // Send success response
      this.sendSuccessResponse(res, { success: true }, 'Note added successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get customer statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getCustomerStatistics(req: Request, res: Response): Promise<void> {
    try {
      // Get statistics from service
      const statistics = await this.customerService.getCustomerStatistics();
      
      // Send success response
      this.sendSuccessResponse(res, statistics, 'Customer statistics retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Export customers data
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async exportCustomers(req: Request, res: Response): Promise<void> {
    try {
      // Get validated query filters
      const filters = (req as any).validatedQuery as CustomerFilterParams || req.query;
      const format = req.query.format as string || 'csv';
      
      // Validate format
      if (!['csv', 'excel'].includes(format)) {
        throw this.errorHandler.createValidationError('Invalid format', ['Format must be csv or excel']);
      }
      
      // Generate export data through service
      const { buffer, filename } = await this.customerService.exportData(filters, format);
      
      // Set appropriate headers and send file
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      
      // Send buffer directly
      res.send(buffer);
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Search customers
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async searchCustomers(req: Request, res: Response): Promise<void> {
    try {
      // Get validated query parameters
      const query = (req as any).validatedQuery || req.query;
      const term = query.term as string;
      
      if (!term || term.length < 2) {
        throw this.errorHandler.createValidationError('Invalid search term', ['Search term must be at least 2 characters']);
      }
      
      // Build service options with pagination
      const options = {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20
      };
      
      // Search customers
      const result = await this.customerService.searchCustomers(term, options);
      
      // Send paginated response
      this.sendPaginatedResponse(res, result.data, result.pagination, 'Customers retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get customer insights
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getCustomerInsights(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Delegate to service
      const insights = await this.customerService.getCustomerInsights(id);
      
      // Send success response
      this.sendSuccessResponse(res, insights, 'Customer insights retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get similar customers
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getSimilarCustomers(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const limit = Number(req.query.limit) || 5;
      
      // Get similar customers from service
      const customers = await this.customerService.findSimilarCustomers(id, limit);
      
      // Send success response
      this.sendSuccessResponse(res, customers, 'Similar customers retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get customer history
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getCustomerHistory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get history from service
      const history = await this.customerService.getCustomerHistory(id);
      
      // Send success response
      this.sendSuccessResponse(res, history, 'Customer history retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Bulk update customers
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async bulkUpdateCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { customerIds, data } = (req as any).validatedData || req.body;
      const authReq = req as AuthenticatedRequest;
      
      // Validate input
      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        throw this.errorHandler.createValidationError('Invalid customer IDs', ['Customer IDs must be a non-empty array']);
      }
      
      if (!data || Object.keys(data).length === 0) {
        throw this.errorHandler.createValidationError('Invalid update data', ['Update data is required']);
      }
      
      // Execute bulk update
      const count = await this.customerService.bulkUpdate(customerIds, data, {
        context: {
          userId: authReq.user?.id,
          userName: authReq.user?.name,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(
        res,
        { count, ids: customerIds },
        `${count} customers updated successfully`
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Send success response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   */
  private sendSuccessResponse(res: Response, data: any, message?: string): void {
    res.status(200).json({
      success: true,
      data,
      message: message || 'Operation successful'
    });
  }

  /**
   * Send created response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   */
  private sendCreatedResponse(res: Response, data: any, message?: string): void {
    res.status(201).json({
      success: true,
      data,
      message: message || 'Resource created successfully'
    });
  }

  /**
   * Send paginated response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param pagination - Pagination information
   * @param message - Success message
   */
  private sendPaginatedResponse(res: Response, data: any[], pagination: any, message?: string): void {
    res.status(200).json({
      success: true,
      data,
      meta: {
        pagination
      },
      message: message || 'Operation successful'
    });
  }

  /**
   * Handle and format errors
   * 
   * @param error - Error object
   * @param req - HTTP request
   * @param res - HTTP response
   */
  private handleError(error: any, req: Request, res: Response): void {
    this.errorHandler.handleError(error, req, res);
  }
}