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
  CustomerFilterParams,
  CustomerResponseDto
} from '../dtos/CustomerDtos.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';
import { BaseController } from '../core/BaseController.js';
import { Customer } from '../entities/Customer.js';

/**
 * Implementation of ICustomerController
 */
export class CustomerController extends BaseController<Customer, CustomerCreateDto, CustomerUpdateDto, CustomerResponseDto> implements ICustomerController {
  /**
   * Creates a new CustomerController instance
   * 
   * @param customerService - Customer service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly customerService: ICustomerService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(customerService, logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.getAllCustomers = this.getAllCustomers.bind(this);
    this.getCustomerById = this.getCustomerById.bind(this);
    this.createCustomer = this.createCustomer.bind(this);
    this.updateCustomer = this.updateCustomer.bind(this);
    this.deleteCustomer = this.deleteCustomer.bind(this);
    this.updateCustomerStatus = this.updateCustomerStatus.bind(this);
    this.addCustomerNote = this.addCustomerNote.bind(this);
    this.getCustomerStatistics = this.getCustomerStatistics.bind(this);
    this.exportCustomers = this.exportCustomers.bind(this);
    this.searchCustomers = this.searchCustomers.bind(this);
    this.getCustomerInsights = this.getCustomerInsights.bind(this);
    this.getSimilarCustomers = this.getSimilarCustomers.bind(this);
    this.getCustomerHistory = this.getCustomerHistory.bind(this);
    this.bulkUpdateCustomers = this.bulkUpdateCustomers.bind(this);
    
    this.logger.debug('Initialisiert CustomerController');
  }

  /**
   * Get all customers with pagination and filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getAllCustomers(req: Request, res: Response): Promise<void> {
    return this.getAll(req, res);
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
      this.handleError(error, res);
    }
  }

  /**
   * Create a new customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async createCustomer(req: Request, res: Response): Promise<void> {
    return this.create(req, res);
  }

  /**
   * Update an existing customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async updateCustomer(req: Request, res: Response): Promise<void> {
    return this.update(req, res);
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
        // Default to soft delete (using the base method)
        return this.delete(req, res);
      }
      
      // Send success response
      this.sendSuccessResponse(
        res,
        { success: true, id, mode: 'hard' },
        'Customer permanently deleted successfully'
      );
    } catch (error) {
      this.handleError(error, res);
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
          name: authReq.user?.name,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(res, customer, 'Customer status updated successfully');
    } catch (error) {
      this.handleError(error, res);
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
      
      // Get updated customer to return
      const updatedCustomer = await this.customerService.getCustomerDetails(id);
      
      // Send success response
      this.sendSuccessResponse(res, { success: true, customer: updatedCustomer }, 'Note added successfully');
    } catch (error) {
      this.handleError(error, res);
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
      this.handleError(error, res);
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
      this.handleError(error, res);
    }
  }

  /**
   * Search customers
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async searchCustomers(req: Request, res: Response): Promise<void> {
    return this.search(req, res);
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
      this.handleError(error, res);
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
      this.handleError(error, res);
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
      this.handleError(error, res);
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
          name: authReq.user?.name,
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
      this.handleError(error, res);
    }
  }
}