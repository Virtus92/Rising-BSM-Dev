import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IContactService } from '@/lib/server/interfaces/IContactService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/contact
 * Holt alle Kontaktanfragen (Nur für Admin und Manager)
 */
export const GET = withRoles(['admin', 'manager'], async (req: NextRequest) => {
  try {
    const contactService = container.resolve<IContactService>('ContactService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const filters = {
      status: status || undefined,
      search: search || undefined,
      limit,
      offset
    };
    
    const result = await contactService.findAll(filters);
    
    return NextResponse.json({
      success: true,
      data: result.requests,
      meta: {
        total: result.total,
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
 * POST /api/contact
 * Erstellt eine neue Kontaktanfrage (Öffentlich zugänglich)
 */
export async function POST(req: NextRequest) {
  try {
    const contactService = container.resolve<IContactService>('ContactService');
    
    // Daten aus dem Request holen
    const data = await req.json();
    
    // IP-Adresse hinzufügen
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      '0.0.0.0';
    
    const contactData = {
      ...data,
      ipAddress
    };
    
    // Kontaktanfrage erstellen
    const contactRequest = await contactService.create(contactData);
    
    return NextResponse.json(
      {
        success: true,
        data: {
          id: contactRequest.id,
          received: true,
          message: 'Ihre Anfrage wurde erfolgreich übermittelt. Wir werden uns in Kürze bei Ihnen melden.'
        },
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
}
