import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IContactService } from '@/lib/server/interfaces/IContactService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * PUT /api/contact/[id]/status
 * Aktualisiert den Status einer Kontaktanfrage (Nur für Admin und Manager)
 */
export const PUT = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const contactService = container.resolve<IContactService>('ContactService');
    
    // ID aus der URL extrahieren
    const urlParts = req.url.split('/');
    const id = parseInt(urlParts[urlParts.length - 2]);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Anfrage-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const request = await contactService.updateStatus(
      id,
      status,
      user.id,
      user.name || `User ${user.id}`
    );
    
    return NextResponse.json({
      success: true,
      data: request,
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
