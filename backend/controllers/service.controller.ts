import { Request, Response } from 'express';
import { BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/authenticated-request.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { ServiceService, serviceService } from '../services/service.service.js';
import { 
  ServiceFilterDTO,
  ServiceCreateDTO,
  ServiceUpdateDTO,
  ServiceStatusUpdateDTO
} from '../types/dtos/service.dto.js';

/**
 * Get all services with optional filtering
 */
export const getAllServices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const filters: ServiceFilterDTO = {
    status: req.query.status as string,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  };

  // Get services from service
  const result = await serviceService.findAll(filters, {
    page: filters.page,
    limit: filters.limit
  });
  
  // Send paginated response
  ResponseFactory.paginated(
    res,
    result.data,
    result.pagination,
    'Services retrieved successfully',
    200,
    { filters }
  );
});

/**
 * Get service by ID
 */
export const getServiceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid service ID');
  }

  // Get service through service
  const result = await serviceService.findById(id, {
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, result);
});

/**
 * Create a new service
 */
export const createService = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Extract create DTO from request body
  const serviceData: ServiceCreateDTO = req.body;
  
  // Create service with user context
  const result = await serviceService.create(serviceData, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send created response
  ResponseFactory.created(res, { serviceId: result.id }, 'Service created successfully');
});

/**
 * Update an existing service
 */
export const updateService = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid service ID');
  }
  
  // Extract update DTO from request body
  const serviceData: ServiceUpdateDTO = req.body;
  
  // Update service with user context
  const result = await serviceService.update(id, serviceData, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined,
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, { serviceId: result.id }, 'Service updated successfully');
});

/**
 * Toggle service status (active/inactive)
 */
export const toggleServiceStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const statusData: ServiceStatusUpdateDTO = req.body;
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid service ID');
  }
  
  // Update status with user context
  const newStatus = statusData.aktiv === 'on' || statusData.aktiv === true;
  const result = await serviceService.updateStatus(id, newStatus, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send success response
  ResponseFactory.success(
    res, 
    { serviceId: id }, 
    `Service ${newStatus ? 'activated' : 'deactivated'} successfully`
  );
});

/**
 * Get service statistics
 */
export const getServiceStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid service ID');
  }
  
  // Get statistics through service
  const statistics = await serviceService.getStatistics(id);
  
  // Send success response
  ResponseFactory.success(res, { statistics });
});