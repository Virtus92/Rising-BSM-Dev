import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/core/auth';
import { IProfileService } from '@/lib/server/interfaces/IProfileService';
import { TokenPayload } from '@/lib/server/core/auth';
import { ILoggingService } from '@/lib/server/interfaces/ILoggingService';

// Dienste, die für diese Route aufgelöst werden sollen
const SERVICES_TO_RESOLVE = ['ProfileService'];

/**
 * GET /api/profile
 * Holt das Profil des aktuellen Benutzers
 */
export const GET = withAuth(
  async (req: NextRequest, user: TokenPayload, services) => {
    const { logger, ProfileService } = services as {
      logger: ILoggingService;
      ProfileService: IProfileService;
    };
    
    logger.info('Profildaten abrufen', { userId: user.id });
    
    const profile = await ProfileService.getProfile(user.id);
    
    return NextResponse.json({
      success: true,
      data: profile,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  },
  SERVICES_TO_RESOLVE
);

/**
 * PUT /api/profile
 * Aktualisiert das Profil des aktuellen Benutzers
 */
export const PUT = withAuth(
  async (req: NextRequest, user: TokenPayload, services) => {
    const { logger, ProfileService } = services as {
      logger: ILoggingService;
      ProfileService: IProfileService;
    };
    
    const data = await req.json();
    logger.info('Profil aktualisieren', { userId: user.id });
    
    // IP-Adresse für die Aktivitätsprotokollierung
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '0.0.0.0';
    
    const updatedUser = await ProfileService.updateProfile(user.id, data);
    
    // Aktivität loggen
    await ProfileService.logUserActivity(user.id, 'Profil aktualisiert', ipAddress as string);
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  },
  SERVICES_TO_RESOLVE
);
