/**
 * Get Appointments API Route Handler
 * Handles retrieving a list of appointments
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

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
    
    // Parse query parameters
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);
    const search = request.nextUrl.searchParams.get('search') || undefined;
    const sortBy = request.nextUrl.searchParams.get('sortBy') || undefined;
    const sortDirection = (request.nextUrl.searchParams.get('sortDirection') as 'asc' | 'desc') || undefined;
    
    // Get customer ID filter if provided
    const customerIdParam = request.nextUrl.searchParams.get('customerId');
    const customerId = customerIdParam ? parseInt(customerIdParam, 10) : undefined;
    
    // Log filter parameters for debugging
    logger.debug('Appointment filter parameters:', { 
      page, limit, search, sortBy, sortDirection, customerId 
    });
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Get appointments list with all filters including customerId
    const result = await appointmentService.getAll({
      page,
      limit,
      filters: {
        search,
        sortBy,
        sortDirection,
        customerId // Pass the customer ID to filter appointments by customer
      }
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