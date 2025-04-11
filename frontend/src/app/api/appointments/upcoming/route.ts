import { NextResponse } from 'next/server';
import { auth } from '../../auth/middleware/authMiddleware';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/appointments/upcoming
 * Returns upcoming appointments within the next 7 days
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

    // Get URL parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Calculate date range (now to X days in the future)
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    // Get appointments within the date range
    // Using appointmentDate instead of scheduledAt based on the schema
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: now,
          lt: futureDate
        }
      },
      orderBy: {
        appointmentDate: 'asc'
      },
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        creator: { // Using creator instead of assignedUser based on schema
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Count total upcoming appointments
    const totalCount = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: now,
          lt: futureDate
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: appointments,
      count: totalCount,
      message: `Retrieved ${appointments.length} upcoming appointments`
    });
  } catch (error) {
    logger.error('[API] Error fetching upcoming appointments:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve upcoming appointments', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
