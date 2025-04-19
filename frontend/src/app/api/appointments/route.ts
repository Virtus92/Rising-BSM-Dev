/**
 * Appointments API-Route
 * 
 * Handles appointment management requests
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { getLogger } from '@/infrastructure/common/logging';
import { CreateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { apiPermissions } from '@/app/api/helpers/apiPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * GET /api/appointments
 * 
 * Retrieves a list of appointments, optionally filtered and paginated
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
    
    // Extract filter parameters from query
    const { searchParams } = new URL(req.url);
    
    // Check for permitted sort fields to prevent errors
    const requestedSortBy = searchParams.get('sortBy') || 'appointmentDate';
    const permittedSortFields = ['appointmentDate', 'title', 'status', 'createdAt', 'updatedAt', 'customerName', 'customer.name'];
    const sortBy = permittedSortFields.includes(requestedSortBy) ? requestedSortBy : 'appointmentDate';
    try {
    const filters = {
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      customerId: searchParams.has('customerId') 
        ? parseInt(searchParams.get('customerId') as string) 
        : undefined,
      page: searchParams.has('page') 
        ? parseInt(searchParams.get('page') as string) 
        : 1,
      limit: searchParams.has('limit') 
        ? parseInt(searchParams.get('limit') as string) 
        : 10,
      sortBy: sortBy,
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'
    };
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Include relations from query params if specified
    const relationsParam = searchParams.get('relations');
    const relations = relationsParam ? relationsParam.split(',') : ['customer'];
    
    // Get appointments through service with proper filters
    const result = await appointmentService.findAll({
      context: { userId: req.auth?.userId },
      page: filters.page,
      limit: filters.limit,
      filters: {
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerId: filters.customerId
      },
      sort: {
        field: filters.sortBy,
        direction: filters.sortDirection
      },
      // Always include requested relations
      relations: relations
    });
    
    return formatResponse.success(result, 'Appointments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Error retrieving appointments',
      500
    );
  }
    },
    SystemPermission.APPOINTMENTS_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/appointments
 * 
 * Creates a new appointment
 * Requires APPOINTMENTS_CREATE permission
 */
export const POST = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
    try {
    // Parse request body
    const data = await req.json() as CreateAppointmentDto;
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Create appointment with all needed context
    const result = await appointmentService.create(data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      },
      // Always include customer relation for complete data
      relations: ['customer']
    });
    
    return formatResponse.success(result, 'Appointment created successfully', 201);
  } catch (error) {
    logger.error('Error creating appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatResponse.validationError(
        (error as any).validationErrors
      );
    }
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Error creating appointment',
      500
    );
  }
    },
    SystemPermission.APPOINTMENTS_CREATE
  ),
  { requiresAuth: true }
);
