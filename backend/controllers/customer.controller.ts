/**
 * Customer Controller
 * 
 * Controller for Customer entity operations handling HTTP requests and responses.
 */
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/controller.types.js';
import { asyncHandler } from '../utils/errors.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { CustomerService, customerService } from '../services/customer.service.js';
import { 
  CustomerCreateDTO, 
  CustomerUpdateDTO, 
  CustomerFilterDTO,
  CustomerStatusUpdateDTO
} from '../types/dtos/customer.dto.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Controller for Customer entity operations
 */
export class CustomerController {
  /**
   * Creates a new CustomerController instance
   * @param service - CustomerService instance
   */
  constructor(private readonly service: CustomerService = customerService) {}

  /**
   * Get all customers with optional filtering
   * @route GET /api/v1/customers
   */
  getAllCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract query parameters as filter options
    const filters: CustomerFilterDTO = {
      status: req.query.status as string,
      type: req.query.type as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as string,
      sortDirection: req.query.sortDirection as 'asc' | 'desc'
    };
    
    // Get customers from service
    const result = await this.service.findAll(filters, {
      page: filters.page,
      limit: filters.limit,
      orderBy: filters.sortBy,
      orderDirection: filters.sortDirection
    });
    
    // Send paginated response
    ResponseFactory.paginated(
      res,
      result.data,
      result.pagination,
      'Customers retrieved successfully'
    );
  });

  /**
   * Get customer by ID with related data
   * @route GET /api/v1/customers/:id
   */
  getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const customerId = Number(id);
    
    if (isNaN(customerId)) {
      throw new BadRequestError('Invalid customer ID');
    }
    
    // Get customer with details from service
    const result = await this.service.findByIdWithDetails(customerId, {
      throwIfNotFound: true
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Customer retrieved successfully');
  });

  /**
   * Create a new customer
   * @route POST /api/v1/customers
   */
  createCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Extract create DTO from request body
    const customerData: CustomerCreateDTO = req.body;
    
    // Create customer with user context
    const result = await this.service.create(customerData, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined
    });
    
    // Send created response
    ResponseFactory.created(res, result, 'Customer created successfully');
  });

  /**
   * Update an existing customer
   * @route PUT /api/v1/customers/:id
   */
  updateCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const customerId = Number(id);
    
    if (isNaN(customerId)) {
      throw new BadRequestError('Invalid customer ID');
    }
    
    // Extract update DTO from request body
    const customerData: CustomerUpdateDTO = req.body;
    
    // Update customer with user context
    const result = await this.service.update(customerId, customerData, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined,
      throwIfNotFound: true
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Customer updated successfully');
  });

  /**
   * Update customer status
   * @route PATCH /api/v1/customers/:id/status
   */
  updateCustomerStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const customerId = Number(id);
    
    if (isNaN(customerId)) {
      throw new BadRequestError('Invalid customer ID');
    }
    
    // Extract status update data
    const { status, note }: CustomerStatusUpdateDTO = req.body;
    
    if (!status) {
      throw new BadRequestError('Status is required');
    }
    
    // Update status with user context
    const result = await this.service.updateStatus(customerId, status, note || null, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Customer status updated successfully');
  });

  /**
   * Add a note to customer
   * @route POST /api/v1/customers/:id/notes
   */
  addCustomerNote = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const customerId = Number(id);
    
    if (isNaN(customerId)) {
      throw new BadRequestError('Invalid customer ID');
    }
    
    // Extract note text
    const { note } = req.body;
    
    if (!note || typeof note !== 'string') {
      throw new BadRequestError('Note text is required');
    }
    
    // Add note with user context
    const result = await this.service.addNote(customerId, note, {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined
    });
    
    // Send success response
    ResponseFactory.success(res, result, 'Note added successfully', 201);
  });

  /**
   * Get customer statistics
   * @route GET /api/v1/customers/statistics
   */
  getCustomerStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Get statistics from service
    const statistics = await this.service.getStatistics();
    
    // Send success response
    ResponseFactory.success(res, statistics, 'Customer statistics retrieved successfully');
  });

  /**
   * Export customers to CSV
   * @route GET /api/v1/customers/export
   */
  exportCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract query parameters as filter options
    const filters: CustomerFilterDTO = {
      status: req.query.status as string,
      type: req.query.type as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortDirection: req.query.sortDirection as 'asc' | 'desc'
    };

    // Get customers from service
    const result = await this.service.findAll(filters, {
      orderBy: filters.sortBy,
      orderDirection: filters.sortDirection
    });

    // Convert customers to CSV
    //const csv = this.service.convertToCSV(result.data);

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');

    // Send CSV data
    res.status(200).send(null);
  });

}

// Create controller instance for use in routes
const customerController = new CustomerController();

// Export controller methods for routes
export const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  addCustomerNote,
  getCustomerStatistics,
  exportCustomers
} = customerController;

export default customerController;