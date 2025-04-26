/**
 * API route for logging client-side errors
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

interface ClientErrorPayload {
  message: string;
  stack?: string;
  source?: string;
  url?: string;
  timestamp?: string;
  user?: {
    id?: number;
    email?: string;
  };
}

/**
 * POST /api/log/client-error
 * Log a client-side error
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();

  try {
    // Parse request body
    const data = await req.json() as ClientErrorPayload;
    
    // Validate required fields
    if (!data.message) {
      return formatResponse.error('Error message is required', 400);
    }

    // Add user ID from authentication if available
    const userId = req.auth?.userId;
    if (userId) {
      data.user = {
        ...data.user,
        id: userId
      };
    }
    
    // Add timestamp if not provided
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Log the error to server logs
    logger.error('Client error:', {
      message: data.message,
      stack: data.stack,
      source: data.source || 'client',
      url: data.url,
      timestamp: data.timestamp,
      user: data.user,
      ip: req.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // In a production environment, you might want to store this in a database
    // or send it to an error tracking service
    
    return formatResponse.success(null, 'Error logged successfully');
  } catch (error) {
    logger.error('Error handling client error logging:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return success anyway, we don't want to cause errors in error handling
    return formatResponse.success(null, 'Error processed');
  }
}, {
  // Don't require authentication for error logging
  requiresAuth: false
});
