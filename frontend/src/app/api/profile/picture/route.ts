import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IProfileService } from '@/lib/server/interfaces/IProfileService';
import { withAuth } from '@/lib/server/core/auth';

/**
 * PUT /api/profile/picture
 * Aktualisiert das Profilbild des aktuellen Benutzers
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const profileService = container.resolve<IProfileService>('ProfileService');
    
    const { pictureUrl } = await req.json();
    
    if (!pictureUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profilbild-URL ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // IP-Adresse für die Aktivitätsprotokollierung
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '0.0.0.0';
    
    const updatedUser = await profileService.updateProfilePicture(user.id, pictureUrl);
    
    // Aktivität loggen
    await profileService.logUserActivity(user.id, 'Profilbild aktualisiert', ipAddress as string);
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        profilePicture: updatedUser.profilePicture
      },
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
