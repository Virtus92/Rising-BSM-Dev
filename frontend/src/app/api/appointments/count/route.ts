import { NextResponse } from 'next/server';
import { auth } from '../../auth/middleware/authMiddleware';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/appointments/count
 * Returns the total count of appointments in the system
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

    // Count appointments
    const count = await prisma.appointment.count();

    return NextResponse.json({
      success: true,
      data: count,
      message: 'Appointment count retrieved successfully'
    });
  } catch (error) {
    logger.error('[API] Error counting appointments:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve appointment count', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
