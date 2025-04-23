import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/appointments/upcoming
 * Returns upcoming appointments within the next X days
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Use service method to get upcoming appointments
    const appointments = await appointmentService.getUpcoming(limit, {
      context,
      days
    });
    
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
    logger.error('Error fetching upcoming appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to retrieve upcoming appointments',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
