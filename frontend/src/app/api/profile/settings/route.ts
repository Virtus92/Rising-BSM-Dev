import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProfileService } from '@/lib/server/interfaces/IProfileService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/profile/settings
 * Holt die Einstellungen des aktuellen Benutzers
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const profileService = container.resolve<IProfileService>('ProfileService');
    
    const profile = await profileService.getProfile(user.id);
    
    return NextResponse.json({
      success: true,
      data: profile.settings,
      meta: {
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

/**
 * PUT /api/profile/settings
 * Aktualisiert die Einstellungen des aktuellen Benutzers
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const profileService = container.resolve<IProfileService>('ProfileService');
    
    const data = await req.json();
    
    // IP-Adresse für die Aktivitätsprotokollierung
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '0.0.0.0';
    
    const updatedSettings = await profileService.updateSettings(user.id, data);
    
    // Aktivität loggen
    await profileService.logUserActivity(user.id, 'Einstellungen aktualisiert', ipAddress as string);
    
    return NextResponse.json({
      success: true,
      data: updatedSettings,
      meta: {
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
