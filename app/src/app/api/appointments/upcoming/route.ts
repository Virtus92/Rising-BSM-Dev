import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { filterDataByUserRole } from '@/app/api/helpers/permissionUtils';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * GET /api/appointments/upcoming
 * Returns upcoming appointments within the next X days
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Enhanced authentication validation: check both auth object and custom header
    const authUserId = request.auth?.userId || null;
    const headerUserId = request.headers.get('X-Auth-User-ID');
    
    // Log authentication details for debugging
    logger.debug('Authentication check details', {
      hasAuthProperty: !!request.auth,
      authUserId: authUserId,
      headerUserId: headerUserId,
      allHeaders: Object.fromEntries([...request.headers.entries()])
    });
    
    // Use either source of authentication
    const userId = authUserId || (headerUserId ? parseInt(headerUserId, 10) : null);
    
    if (!userId) {
      logger.warn('Upcoming appointments access attempted without authentication');
      return formatResponse.unauthorized('Authentication required');
    }
    
    // Ensure the request auth object is available for the rest of the function
    if (!request.auth && userId) {
      // If only the header is available, create the auth object
      Object.defineProperty(request, 'auth', {
        value: { userId },
        writable: false,
        enumerable: true,
        configurable: false
      });
    }
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Context for service calls - use the authenticated user ID
    const context = { userId: request.auth?.userId || userId };
    
    // Use service method to get upcoming appointments
    let appointments = await appointmentService.getUpcoming(limit, {
      context,
      days
    });
    
    // Apply role-based filtering
    appointments = await filterDataByUserRole(
      request.auth?.userId || userId,
      appointments,
      // Function to get the owner ID from an appointment
      (appointment) => appointment.createdBy
    );
    
    // If no appointments are accessible based on permissions, return empty array
    if (!appointments || appointments.length === 0) {
      return formatResponse.success([], `No upcoming appointments found for user`);
    }
    
    // Get customer service for enriching customer data
    const customerService = serviceFactory.createCustomerService();
    
    // Process appointments to ensure they have customer info
    if (appointments && Array.isArray(appointments)) {
      // Use Promise.all to load all customer data in parallel
      await Promise.all(
        appointments.map(async (appointment) => {
          if (appointment.customerId && (!appointment.customerName || !appointment.customerData)) {
            try {
              const customer = await customerService.getById(appointment.customerId, {
                context
              });
              
              if (customer) {
                appointment.customerName = customer.name;
                appointment.customerData = {
                  id: customer.id,
                  name: customer.name,
                  email: customer.email,
                  phone: customer.phone
                };
              } else {
                // Set default values if customer not found
                appointment.customerName = `Customer ${appointment.customerId}`;
              }
            } catch (customerError) {
              // Log error but continue processing
              logger.warn(`Failed to load customer data for appointment ${appointment.id}:`, {
                error: customerError instanceof Error ? customerError.message : String(customerError),
                customerId: appointment.customerId
              });
              
              // Set default values
              appointment.customerName = `Customer ${appointment.customerId}`;
            }
          }
        })
      );
    }
    
    return formatResponse.success(appointments, `Retrieved upcoming appointments successfully`);
  } catch (error) {
    // Improved error handling with better diagnostics
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log detailed error information
    logger.error('Error fetching upcoming appointments:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.auth?.userId || 'unknown',
      requestUrl: request.url
    });
    
    // Check for specific error types
    if (errorMessage.includes('Authentication') || errorMessage.includes('auth')) {
      return formatResponse.unauthorized('Authentication required');
    }
    
    if (errorMessage.includes('Permission') || errorMessage.includes('permission')) {
      return formatResponse.forbidden('Permission denied to view appointments');
    }
    
    return formatResponse.error(
      'Failed to retrieve upcoming appointments',
      500
    );
  }
}, {
  // Consistent with other secure endpoints - require authentication
  requiresAuth: true,
  cacheControl: 'no-store, max-age=0'
});