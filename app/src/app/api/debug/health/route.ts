import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { getPrismaClient } from '@/core/db/prisma';

const logger = getLogger();

/**
 * API handler for system health check
 * This endpoint provides information about system services and database connectivity
 * 
 * @param request NextRequest with auth information
 * @returns Health check information
 */
export async function GET(request: NextRequest) {
  try {
    // Start timing the health check
    const startTime = Date.now();
    
    // Get service factory
    const serviceFactory = getServiceFactory();
    
    // Test database connection
    let dbStatus: { connected: boolean; error?: string; latency?: number } = { connected: false };
    try {
      const prisma = getPrismaClient();
      const startDbTime = Date.now();
      
      // Simple query to test database connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      dbStatus = {
        connected: true,
        latency: Date.now() - startDbTime
      };
    } catch (dbError) {
      dbStatus = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : String(dbError)
      };
    }
    
    // Check service availability
    const services = {
      userService: { available: !!serviceFactory.createUserService() },
      permissionService: { available: !!serviceFactory.createPermissionService() },
      authService: { available: !!serviceFactory.createAuthService() },
      customerService: { available: !!serviceFactory.createCustomerService() },
      appointmentService: { available: !!serviceFactory.createAppointmentService() },
      notificationService: { available: !!serviceFactory.createNotificationService() }
    };
    
    // Check auth middleware
    const authMiddlewareStatus = {
      available: !!request.auth,
      hasUserId: !!request.auth?.userId
    };
    
    // Authentication status
    const authStatus = {
      authenticated: !!request.auth?.userId,
      userId: request.auth?.userId,
      xAuthToken: !!request.headers.get('x-auth-token'),
      authCookie: !!request.cookies.get('auth_token')
    };
    
    // System information
    const systemInfo = {
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : undefined
    };
    
    // Request information
    const requestInfo = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    };
    
    // Collect all health check information
    const healthInfo = {
      status: 'OK',
      dbStatus,
      services,
      authMiddlewareStatus,
      authStatus,
      systemInfo,
      requestInfo,
      responseTime: Date.now() - startTime
    };
    
    // Return health check information
    return formatResponse.success(healthInfo, 'System health check');
  } catch (error) {
    // Log error and return error response
    logger.error('Error in health check endpoint', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return formatResponse.error(
      `Health check failed: ${error instanceof Error ? error.message : String(error)}`, 
      500
    );
  }
}

/**
 * Options handler for CORS
 */
export function OPTIONS() {
  return formatResponse.success(null, 'OK');
}