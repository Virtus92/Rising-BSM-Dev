/**
 * GET /api/appointments/count
 * Returns the total count of appointments in the system
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get the appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Extract filters from query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate') as string) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate') as string) 
        : undefined,
      customerId: searchParams.has('customerId') 
        ? parseInt(searchParams.get('customerId') as string) 
        : undefined
    };
    
    // Get count from service with any filters
    const result = await appointmentService.count({
      context,
      filters
    });
    
    // Ensure we have a proper count response
    let count = 0;
    
    if (typeof result === 'number') {
      count = result;
    } else if (result && typeof result === 'object') {
      if ('count' in result) {
        count = result.count as number;
      } else if ('total' in result) {
        count = result.total as number;
      }
    }
    
    return formatResponse.success({ count }, 'Appointment count retrieved successfully');
  } catch (error) {
    logger.error('Error counting appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to retrieve appointment count',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
