import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { UserRole } from '@/domain/entities/User';

/**
 * Route that requires authentication
 */
export const GET = routeHandler(
  async (request: NextRequest) => {
    const userId = request.auth?.userId;
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        userId,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  },
  { 
    requiresAuth: true 
  }
);

/**
 * Route that requires specific role (admin or manager)
 */
export const POST = routeHandler(
  async (request: NextRequest) => {
    const userId = request.auth?.userId;
    
    return NextResponse.json({
      success: true,
      message: 'You have admin or manager permissions',
      data: {
        userId,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  },
  { 
    requiresAuth: true,
    requiredRole: [UserRole.ADMIN, UserRole.MANAGER]
  }
);

/**
 * Route that requires employee role
 */
export const PUT = routeHandler(
  async (request: NextRequest) => {
    const userId = request.auth?.userId;
    
    return NextResponse.json({
      success: true,
      message: 'You have employee permissions',
      data: {
        userId,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  },
  { 
    requiresAuth: true,
    requiredRole: [UserRole.EMPLOYEE]
  }
);