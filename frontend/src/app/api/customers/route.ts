import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { ICustomerService } from '@/lib/server/interfaces/ICustomerService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/customers
 * Gibt alle Kunden zurück
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const customerService = container.resolve<ICustomerService>('CustomerService');
    
    // Query-Parameter extrahieren
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    const filters = {
      status: status || undefined,
      type: type || undefined,
      search: search || undefined,
      limit,
      offset
    };
    
    const result = await customerService.findAll(filters);
    
    return NextResponse.json({
      success: true,
      data: result.customers,
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
 * POST /api/customers
 * Erstellt einen neuen Kunden
 */
export const POST = withRoles(['admin', 'manager'], async (req: NextRequest, user) => {
  try {
    const customerService = container.resolve<ICustomerService>('CustomerService');
    
    const data = await req.json();
    
    const customer = await customerService.create(data, user.id, user.name || `User ${user.id}`);
    
    return NextResponse.json(
      {
        success: true,
        data: customer,
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
