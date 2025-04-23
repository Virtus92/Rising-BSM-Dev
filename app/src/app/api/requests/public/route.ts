/**
 * Public Requests API Route
 * Handles contact requests from unauthenticated users
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * POST /api/requests/public
 * 
 * Creates a new public contact request (no authentication required)
 */
export const POST = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get request data from body
    const body = await request.json();
    const { name, email, phone, service, message } = body;
    
    // Basic validation
    if (!name || !email || !service || !message) {
      return formatResponse.error('Incomplete data - Please fill all required fields', 400);
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return formatResponse.error('The provided email address has an invalid format', 400);
    }
    
    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Prepare request data
    const requestData = {
      name,
      email,
      phone,
      service,
      message,
      status: 'NEW',
      source: 'website',
      priority: 'MEDIUM'
    };
    
    // Create context with IP address
    const context = {
      ipAddress: ipAddress.split(',')[0]
    };
    
    // Create the request
    const newRequest = await requestService.create(requestData, { context });
    
    // Success response
    return formatResponse.success({
      id: newRequest.id,
      createdAt: newRequest.createdAt
    }, 'Thank you for your request! We will contact you shortly.', 201);
  } catch (error) {
    logger.error('Error creating public request:', {
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
      'Sorry, there was an error processing your request. Please try again later.',
      500
    );
  }
}, {
  // Public endpoint - no auth required
  requiresAuth: false
});
