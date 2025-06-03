/**
 * Get Appointments API Route Handler
 * Handles retrieving a list of appointments
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { AppointmentFilterParamsDto } from '@/domain/dtos/AppointmentDtos';

/**
 * Handles GET /api/appointments - List appointments
 */
export async function getAppointmentsHandler(
  request: NextRequest
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Appointments access attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.APPOINTMENTS_VIEW
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission to view appointments`);
      return formatResponse.error(
        `You don't have permission to view appointments`, 
        403
      );
    }
    
    // Extract filter parameters from query - COMPREHENSIVE PARAMETER EXTRACTION
    const { searchParams } = new URL(request.url);
    
    // Check for permitted sort fields to prevent errors
    const requestedSortBy = searchParams.get('sortBy') || 'appointmentDate';
    const permittedSortFields = ['appointmentDate', 'appointmentTime', 'title', 'status', 'customerId', 'createdAt', 'updatedAt'];
    const sortBy = permittedSortFields.includes(requestedSortBy) ? requestedSortBy : 'appointmentDate';
    
    // Ensure sort direction is valid
    const requestedSortDirection = searchParams.get('sortDirection') || 'asc';
    const sortDirection = ['asc', 'desc'].includes(requestedSortDirection) ? requestedSortDirection as 'asc' | 'desc' : 'asc';
    
    // Build comprehensive filter object
    const filters: AppointmentFilterParamsDto = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as AppointmentStatus || undefined,
      customerId: searchParams.has('customerId') 
        ? parseInt(searchParams.get('customerId') as string, 10)
        : undefined,
      createdById: searchParams.has('createdById')
        ? parseInt(searchParams.get('createdById') as string, 10)
        : undefined,
      // Date filtering
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      // Special date filters
      today: searchParams.has('today') 
        ? searchParams.get('today') === 'true'
        : undefined,
      upcoming: searchParams.has('upcoming')
        ? searchParams.get('upcoming') === 'true'
        : undefined,
      past: searchParams.has('past')
        ? searchParams.get('past') === 'true'
        : undefined,
      // Pagination
      page: searchParams.has('page') 
        ? parseInt(searchParams.get('page') as string, 10)
        : 1,
      limit: searchParams.has('limit') 
        ? parseInt(searchParams.get('limit') as string, 10)
        : 10,
      // Sorting
      sortBy: sortBy,
      sortDirection: sortDirection
    };
    
    logger.debug('Appointment filters:', filters);
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Get user from headers (set by auth middleware)
    const userId = parseInt(request.headers.get('X-User-Id') || '0');
    const context = { userId };
    
    // Use the service for getting data with comprehensive filters
    const result = await appointmentService.getAll({
      context,
      page: filters.page,
      limit: filters.limit,
      filters: {
        status: filters.status,
        customerId: filters.customerId,
        createdById: filters.createdById,
        startDate: filters.startDate,
        endDate: filters.endDate,
        today: filters.today,
        upcoming: filters.upcoming,
        past: filters.past,
        search: filters.search // CRITICAL: Include search in filters
      },
      sort: {
        field: filters.sortBy || 'appointmentDate',
        direction: (filters.sortDirection || 'asc') as 'asc' | 'desc'
      },
      // Always include customer relation for complete data
      relations: ['customer']
    });
    
    return formatResponse.success(result, 'Appointments retrieved successfully');
  } catch (error) {
    logger.error('Error fetching appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch appointments',
      500
    );
  }
}
