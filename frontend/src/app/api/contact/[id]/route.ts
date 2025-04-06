import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IContactService } from '@/lib/server/interfaces/IContactService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/contact/[id]
 * Holt eine bestimmte Kontaktanfrage anhand ihrer ID (Nur für Admin und Manager)
 */
export const GET = withRoles(['admin', 'manager'], async (req: NextRequest) => {
  try {
    const contactService = container.resolve<IContactService>('ContactService');
    
    // ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
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
    
    const request = await contactService.findById(id);
    
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

/**
 * PUT /api/contact/[id]
 * Aktualisiert eine bestimmte Kontaktanfrage anhand ihrer ID (Nur für Admin und Manager)
 */
export const PUT = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const contactService = container.resolve<IContactService>('ContactService');
    
    // ID aus der URL extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
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
    
    const data = await req.json();
    
    const request = await contactService.update(id, data, user.id, user.name || `User ${user.id}`);
    
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
