import { NextResponse } from 'next/server';
import { auth } from '../../auth/middleware/authMiddleware';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/requests/count
 * Returns the total count of contact requests in the system
 */
export async function GET(request: Request) {
  const logger = getLogger();
  
  try {
    // Verify authentication
    const authResult = await auth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      );
    }

    // Get prisma client
    const prisma = getPrismaClient();

    // Count contact requests
    const count = await prisma.contactRequest.count();

    return NextResponse.json({
      success: true,
      data: count,
      message: 'Request count retrieved successfully'
    });
  } catch (error) {
    logger.error('[API] Error counting requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve request count', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
