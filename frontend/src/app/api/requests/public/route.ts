import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * POST /api/requests/public
 * 
 * Erstellt eine neue öffentliche Kontaktanfrage (ohne Authentifizierung).
 */
export const POST = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Daten aus Request-Body auslesen
    const body = await request.json();
    const { name, email, phone, service, message } = body;
    
    // Basic validation
    if (!name || !email || !service || !message) {
      return formatError('Incomplete data - Please fill all required fields', 400);
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return formatError('The provided email address has an invalid format', 400);
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
    return formatSuccess({
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
      return formatValidationError(
        (error as any).validationErrors,
        'The request could not be processed due to validation errors'
      );
    }
    
    return formatError(
      'Sorry, there was an error processing your request. Please try again later.',
      500
    );
  }
}, {
  // Public endpoint - no auth required
  requiresAuth: false
});
