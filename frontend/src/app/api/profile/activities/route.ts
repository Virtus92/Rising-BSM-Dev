import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProfileService } from '@/lib/server/interfaces/IProfileService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/profile/activities
 * Holt die Aktivitäten des aktuellen Benutzers
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const profileService = container.resolve<IProfileService>('ProfileService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    const activities = await profileService.getUserActivities(user.id, limit);
    
    return NextResponse.json({
      success: true,
      data: activities,
      meta: {
        count: activities.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Interner Serverfehler',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});
