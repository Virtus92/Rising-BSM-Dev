import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession, authOptions } from '@/app/api/auth/middleware/authMiddleware';

const prisma = new PrismaClient();

/**
 * GET /api/requests/stats
 * 
 * Ruft Statistiken zu Kontaktanfragen ab.
 */
export async function GET(request: NextRequest) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // URL-Parameter abrufen
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Zeitraum bestimmen
    const startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Standard: 30 Tage
        startDate.setDate(startDate.getDate() - 30);
    }

    // Alle Anfragen im Zeitraum zählen
    const totalRequests = await prisma.contactRequest.count({
      where: { createdAt: { gte: startDate } }
    });

    // Neue Anfragen zählen
    const newRequests = await prisma.contactRequest.count({
      where: {
        status: 'new',
        createdAt: { gte: startDate }
      }
    });

    // In Bearbeitung zählen
    const inProgressRequests = await prisma.contactRequest.count({
      where: {
        status: 'in_progress',
        createdAt: { gte: startDate }
      }
    });

    // Abgeschlossene Anfragen zählen
    const completedRequests = await prisma.contactRequest.count({
      where: {
        status: 'completed',
        createdAt: { gte: startDate }
      }
    });

    // Abgebrochene Anfragen zählen
    const cancelledRequests = await prisma.contactRequest.count({
      where: {
        status: 'cancelled',
        createdAt: { gte: startDate }
      }
    });

    // Konvertierte Anfragen zählen (mit Kunden verknüpft)
    const convertedRequests = await prisma.contactRequest.count({
      where: {
        customerId: { not: null },
        createdAt: { gte: startDate }
      }
    });

    // Konversionsrate berechnen
    const conversionRate = totalRequests > 0
      ? (convertedRequests / totalRequests) * 100
      : 0;

    // Anzahl der Anfragen pro Tag/Woche/Monat
    let timeSeriesData = [];
    if (period === 'week') {
      // Letzte 7 Tage
      timeSeriesData = await getRequestsPerDay(startDate);
    } else if (period === 'month') {
      // Letzte 4 Wochen
      timeSeriesData = await getRequestsPerWeek(startDate);
    } else {
      // Letztes Jahr (pro Monat)
      timeSeriesData = await getRequestsPerMonth(startDate);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRequests,
        newRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        convertedRequests,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        timeSeriesData
      }
    });
  } catch (error) {
    console.error('Error fetching request stats:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Holt Anfragen pro Tag für den angegebenen Zeitraum
 * 
 * @param startDate - Startdatum
 * @returns Array mit Daten pro Tag
 */
async function getRequestsPerDay(startDate: Date) {
  // Zeitraum von startDate bis jetzt in Tage aufteilen
  const days = [];
  const endDate = new Date();
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  
  const result = [];
  
  // Für jeden Tag Anfragen zählen
  for (const day of days) {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const count = await prisma.contactRequest.count({
      where: {
        createdAt: {
          gte: day,
          lt: nextDay
        }
      }
    });
    
    result.push({
      date: day.toISOString().split('T')[0],
      count
    });
  }
  
  return result;
}

/**
 * Holt Anfragen pro Woche für den angegebenen Zeitraum
 * 
 * @param startDate - Startdatum
 * @returns Array mit Daten pro Woche
 */
async function getRequestsPerWeek(startDate: Date) {
  // Zeitraum von startDate bis jetzt in Wochen aufteilen
  const weeks = [];
  const endDate = new Date();
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    weeks.push(new Date(d));
  }
  
  const result = [];
  
  // Für jede Woche Anfragen zählen
  for (let i = 0; i < weeks.length; i++) {
    const weekStart = weeks[i];
    const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : new Date();
    
    const count = await prisma.contactRequest.count({
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    });
    
    result.push({
      date: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
      count
    });
  }
  
  return result;
}

/**
 * Holt Anfragen pro Monat für den angegebenen Zeitraum
 * 
 * @param startDate - Startdatum
 * @returns Array mit Daten pro Monat
 */
async function getRequestsPerMonth(startDate: Date) {
  // Zeitraum von startDate bis jetzt in Monate aufteilen
  const months = [];
  const endDate = new Date();
  
  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    months.push(new Date(d));
  }
  
  const result = [];
  
  // Für jeden Monat Anfragen zählen
  for (let i = 0; i < months.length; i++) {
    const monthStart = months[i];
    const monthEnd = i < months.length - 1 ? months[i + 1] : new Date();
    
    const count = await prisma.contactRequest.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEnd
        }
      }
    });
    
    // Format: "Jan 2023"
    const monthName = monthStart.toLocaleString('de', { month: 'short' });
    const year = monthStart.getFullYear();
    
    result.push({
      date: `${monthName} ${year}`,
      count
    });
  }
  
  return result;
}
