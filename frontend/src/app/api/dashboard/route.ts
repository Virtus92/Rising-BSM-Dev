import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';

const prisma = new PrismaClient();

/**
 * GET /api/dashboard
 * 
 * Ruft Dashboard-Daten ab, einschließlich Statistiken zu Kunden, Terminen, Anfragen usw.
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  try {
    // Authentifizierung wird durch den apiRouteHandler geprüft

    // Statistiken sammeln
    const stats = {
      // Kundenzahlen
      customers: {
        total: await prisma.customer.count({
          where: { status: 'active' }
        }),
        new: await prisma.customer.count({
          where: {
            status: 'active',
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Letzte 30 Tage
          }
        })
      },

      // Termine
      appointments: {
        total: await prisma.appointment.count(),
        upcoming: await prisma.appointment.count({
          where: {
            appointmentDate: { gte: new Date() },
            status: { in: ['planned', 'confirmed'] }
          }
        }),
        today: await prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        })
      },

      // Anfragen
      requests: {
        total: await prisma.contactRequest.count(),
        new: await prisma.contactRequest.count({
          where: { status: 'new' }
        }),
        inProgress: await prisma.contactRequest.count({
          where: { status: 'in_progress' }
        }),
        completed: await prisma.contactRequest.count({
          where: { status: 'completed' }
        })
      }
    };

    // Aktuelle Termine (kommende 7 Tage)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: new Date(),
          lt: nextWeek
        },
        status: { in: ['planned', 'confirmed'] }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'asc'
      },
      take: 5
    });

    // Neue Kontaktanfragen
    const recentRequests = await prisma.contactRequest.findMany({
      where: {
        status: { in: ['new', 'in_progress'] }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Letzte Kundenaktivitäten
    const recentCustomerActivities = await prisma.customerLog.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return formatSuccess({
        stats,
        upcomingAppointments,
        recentRequests,
        recentCustomerActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return formatError(
      error instanceof Error ? error.message : 'Server-Fehler beim Abrufen der Dashboard-Daten',
      500
    );
  }
});
