import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IContactService } from '@/lib/server/interfaces/IContactService';
import { withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/contact/[id]/notes
 * Holt alle Notizen für eine bestimmte Kontaktanfrage (Nur für Admin und Manager)
 */
export const GET = withRoles(['admin', 'manager'], async (req: NextRequest) => {
  try {
    const contactService = container.resolve<IContactService>('ContactService');
    
    // ID aus der URL extrahieren
    const urlParts = req.url.split('/');
    const requestId = parseInt(urlParts[urlParts.length - 2]);
    
    if (isNaN(requestId) || requestId <= 0) {
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
    
    const notes = await contactService.getRequestNotes(requestId);
    
    return NextResponse.json({
      success: true,
      data: notes,
      meta: {
        requestId,
        count: notes.length,
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
 * POST /api/contact/[id]/notes
 * Fügt eine neue Notiz zu einer Kontaktanfrage hinzu (Nur für Admin und Manager)
 */
export const POST = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const contactService = container.resolve<IContactService>('ContactService');
    
    // ID aus der URL extrahieren
    const urlParts = req.url.split('/');
    const requestId = parseInt(urlParts[urlParts.length - 2]);
    
    if (isNaN(requestId) || requestId <= 0) {
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
    
    const { text } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notiztext ist erforderlich',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const note = await contactService.addNote(
      requestId,
      user.id,
      user.name || `User ${user.id}`,
      text
    );
    
    return NextResponse.json(
      {
        success: true,
        data: note,
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    );
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
