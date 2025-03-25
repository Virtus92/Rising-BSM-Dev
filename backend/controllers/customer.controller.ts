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
import { AuthenticatedRequest } from '../types/controller.types.js';
import { processPagination } from '../utils/http.utils.js';
import { ValidationError } from '../utils/error.utils.js';

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
  // Get statistics from service
  const statistics = await customerService.getCustomerStatistics();
  
  // Return statistics
  ResponseFactory.success(
    res,
    statistics,
    'Customer statistics retrieved successfully'
  );
});

/**
 * Delete customer
 */
export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const authReq = req as AuthenticatedRequest;
  const hardDelete = req.query.mode === 'hard';
  
  // Delete customer with user context
  const result = await customerService.delete(id, {
    userId: authReq.user?.id,
    softDelete: !hardDelete // Use soft delete if not hard delete
  });
  
  // Return success response
  ResponseFactory.success(
    res,
    { success: true, id, mode: hardDelete ? 'hard' : 'soft' },
    `Customer ${hardDelete ? 'permanently ' : ''}deleted successfully`
  );
});

/**
 * Get customer insights with detailed statistics
 */
export const getCustomerInsights = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  
  // Delegate to service
  const insights = await customerService.getCustomerInsights(id);
  
  // Return consistent response with ResponseFactory
  ResponseFactory.success(
    res,
    insights,
    'Customer insights retrieved successfully'
  );
});

/**
 * Find similar customers based on attributes
 */
export const getSimilarCustomers = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const limit = Number(req.query.limit) || 5;
  
  // Get similar customers from repository via service
  const customers = await customerService.findSimilarCustomers(id, limit);
  // Map each customer to DTO for consistent responses
  const customerDtos = customers.map((customer: any) => customer);
  
  ResponseFactory.success(
    res,
    customerDtos,
    'Similar customers retrieved successfully'
  );
});

/**
 * Search customers with advanced filtering
 */
export const searchCustomers = asyncHandler(async (req: Request, res: Response) => {
  // Get validated query parameters
  const { term, ...filters } = (req as any).validatedQuery;
  
  // Process pagination params with utility functions
  const paginationParams = processPagination({
    page: req.query.page as string,
    limit: req.query.limit as string
  });
  
  // Build filter with processed params
  const searchFilters: CustomerFilterParams = {
    search: term,
    ...filters,
    page: paginationParams.current,
    limit: paginationParams.limit
  };
  
  // Get results from service
  const result = await customerService.findAll(searchFilters);
  // Return paginated response
  ResponseFactory.paginated(
    res,
    result.data,
    {
      ...result.pagination,
      skip: (filters.page - 1) * filters.limit
    },
    'Customers retrieved successfully'
  );
});

/**
 * Bulk update multiple customers
 */
export const bulkUpdateCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { customerIds, data } = (req as any).validatedData;
  const authReq = req as AuthenticatedRequest;
  
  // Perform validation first - through validation middleware
  const updateData = data as CustomerUpdateDTO;
  
  // Execute bulk update
  const result = await customerService.bulkUpdate(customerIds, updateData, {
    userId: authReq.user?.id
  });
  
  // Return consistent success response
  ResponseFactory.success(
    res,
    { count: result, ids: customerIds },
    `${result} customers updated successfully`
  );
});

/**
 * Get customer history/activity log
 */
export const getCustomerHistory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  
  // Get history from service
  const history = await customerService.getCustomerHistory(id);
  
  // Return consistent response
  ResponseFactory.success(
    res,
    history,
    'Customer history retrieved successfully'
  );
});

/**
 * Export customers to CSV/Excel
 */
export const exportCustomers = asyncHandler(async (req: Request, res: Response) => {
  // Get validated query filters
  const filters = (req as any).validatedQuery as CustomerFilterParams;
  const format = req.query.format as string || 'csv';
  
  // Validate format
  if (!['csv', 'excel'].includes(format)) {
    throw new ValidationError('Invalid format', ['Format must be csv or excel']);
  }
  
  // Generate export data through service
  const { buffer, filename } = await customerService.exportData(filters, format);
  
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
});