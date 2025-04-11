import { NextResponse } from 'next/server';
import { auth } from '../../auth/middleware/authMiddleware';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/customers/count
 * Returns the total count of customers in the system
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

    // Count customers
    const count = await prisma.customer.count();

    return NextResponse.json({
      success: true,
      data: count,
      message: 'Customer count retrieved successfully'
    });
  } catch (error) {
    logger.error('[API] Error counting customers:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve customer count', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
