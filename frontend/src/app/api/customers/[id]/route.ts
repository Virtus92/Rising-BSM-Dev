import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { ICustomerService } from '@/lib/server/interfaces/ICustomerService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/customers/[id]
 * Holt einen bestimmten Kunden anhand seiner ID
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const customerService = container.resolve<ICustomerService>('CustomerService');
    
    // ID aus dem URL-Pfad extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Kunden-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const customer = await customerService.findById(id);
    
    return NextResponse.json({
      success: true,
      data: customer,
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
 * PUT /api/customers/[id]
 * Aktualisiert einen bestimmten Kunden anhand seiner ID (Nur für Admin und Manager)
 */
export const PUT = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const customerService = container.resolve<ICustomerService>('CustomerService');
    
    // ID aus dem URL-Pfad extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Kunden-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    
    const customer = await customerService.update(id, data, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: customer,
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
 * DELETE /api/customers/[id]
 * Löscht einen bestimmten Kunden anhand seiner ID (Nur für Admin)
 */
export const DELETE = withRoles(['admin'], async (req: NextRequest, user) => {
  try {
    const customerService = container.resolve<ICustomerService>('CustomerService');
    
    // ID aus dem URL-Pfad extrahieren
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ungültige Kunden-ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const result = await customerService.delete(id, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json({
      success: result,
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
