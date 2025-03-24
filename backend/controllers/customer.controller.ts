// controllers/customer.controller.ts
import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service.js';
import { 
  CustomerCreateDTO, 
  CustomerUpdateDTO, 
  CustomerFilterParams,
  CustomerStatusUpdateDTO
} from '../types/dtos/customer.dto.js';
import { ResponseFactory } from '../utils/http.utils.js';
import { asyncHandler } from '../utils/error.utils.js';
import { ValidationRule, ValidationSchema } from '../types/validation.types.js';
import { AuthenticatedRequest } from '../types/controller.types.js';
import { processPagination, completePagination } from '../utils/http.utils.js';

// Create customer service
const customerService = new CustomerService();

/**
 * Get customers with pagination and filtering
 */
export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
  // Parse filter parameters
  const filters: CustomerFilterParams = {
    search: req.query.search as string,
    status: req.query.status as string,
    type: req.query.type as string,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    sortBy: req.query.sortBy as string,
    sortDirection: (req.query.sortDirection as 'asc' | 'desc') || 'desc'
  };
  
  // Get customers from service
  const result = await customerService.findAll(filters);
  
  // Add skip property required by http.utils
  const paginationWithSkip = {
    ...result.pagination,
    skip: (result.pagination.current - 1) * result.pagination.limit
  };
  
  // Return paginated response
  return ResponseFactory.paginated(
    res,
    result.data,
    paginationWithSkip,
    'Customers retrieved successfully'
  );
});

/**
 * Get customer by ID
 */
export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  
  // Get detailed customer data
  const customer = await customerService.getCustomerDetail(id);
  
  // Return success response
  ResponseFactory.success(
    res,
    customer,
    'Customer retrieved successfully'
  );
});

/**
 * Create a new customer
 */
export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customerData = (req as any).validatedData as CustomerCreateDTO;
  const authReq = req as AuthenticatedRequest;
  
  // Create customer with user context
  const customer = await customerService.create(customerData, {
    userId: authReq.user?.id
  });
  
  // Return created response
  ResponseFactory.created(
    res,
    customer,
    'Customer created successfully'
  );
});

/**
 * Update customer
 */
export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const customerData = (req as any).validatedData as CustomerUpdateDTO;
  const authReq = req as AuthenticatedRequest;
  
  // Update customer with user context
  const customer = await customerService.update(id, customerData, {
    userId: authReq.user?.id
  });
  
  // Return success response
  ResponseFactory.success(
    res,
    customer,
    'Customer updated successfully'
  );
});

/**
 * Update customer status
 */
export const updateCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status, note } = (req as any).validatedData as CustomerStatusUpdateDTO;
  const authReq = req as AuthenticatedRequest;
  
  // Update status
  const customer = await customerService.update(id, { status }, {
    userId: authReq.user?.id
  });
  
  // Add note if provided
  if (note && authReq.user) {
    await customerService.addNote(
      id,
      note,
      authReq.user.id,
      authReq.user.name
    );
  }
  
  // Return success response
  ResponseFactory.success(
    res,
    customer,
    'Customer status updated successfully'
  );
});

/**
 * Add a note to customer
 */
export const addCustomerNote = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { text } = (req as any).validatedData;
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    throw new Error('User not authenticated');
  }
  
  // Add note
  await customerService.addNote(
    id,
    text,
    authReq.user.id,
    authReq.user.name
  );
  
  // Return success response
  ResponseFactory.success(
    res,
    { success: true },
    'Note added successfully'
  );
});

/**
 * Get customer statistics
 */
export const getCustomerStatistics = asyncHandler(async (req: Request, res: Response) => {
  // This would be implemented with additional service methods
  // Example statistics: count by type, status, etc.
  
  ResponseFactory.success(
    res,
    {
      total: 0,
      byType: {},
      byStatus: {},
      trend: {
        thisMonth: 0,
        lastMonth: 0,
        percentage: 0
      }
    },
    'Customer statistics retrieved successfully'
  );
});

/**
 *  Remove customer
 */



/**
 * Export customers to CSV/Excel
 */
export const exportCustomers = asyncHandler(async (req: Request, res: Response) => {
  // This would be implemented with additional service methods
  // to format and export customer data
  
  ResponseFactory.success(
    res,
    { url: '/exports/customers.csv' },
    'Export initiated successfully'
  );
});