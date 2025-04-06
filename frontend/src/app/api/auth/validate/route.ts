import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/core/auth';

/**
 * GET /api/auth/validate
 * Validiert den aktuellen Authentifizierungsstatus des Benutzers
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
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
