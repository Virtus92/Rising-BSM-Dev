/**
 * Health-Check API-Route
 * 
 * Diese Route prüft den Zustand der Anwendung und gibt Statusinformationen zurück.
 */
import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/utils/api/response';
import { ApiError } from '@/lib/utils/api/error';
import { getPrismaClient } from '@/lib/core/bootstrap';

/**
 * GET /api/health
 * Gibt den Gesamtzustand der Anwendung zurück
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Prüfe Datenbankverbindung
    const prisma = getPrismaClient();
    const dbResult = await prisma.$queryRaw`SELECT 1 as result`;
    const dbConnected = Array.isArray(dbResult) && dbResult.length > 0;
    
    // Antwort vorbereiten
    const responseTime = Date.now() - startTime;
    
    return successResponse({
      status: 'healthy',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      database: {
        connected: dbConnected,
        type: 'postgresql'
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return ApiError.handleError(error);
  }
}
