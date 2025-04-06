import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IUserService } from '@/lib/server/interfaces/IUserService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/users
 * Gibt alle Benutzer zurück (Nur für Admin und Manager)
 */
export const GET = withRoles(['admin', 'manager'], async (req: NextRequest) => {
  try {
    const userService = container.resolve<IUserService>('UserService');
    const users = await userService.findAll();
    
    return NextResponse.json({
      success: true,
      data: users,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});

/**
 * POST /api/users
 * Erstellt einen neuen Benutzer (Nur für Admin)
 */
export const POST = withRoles(['admin'], async (req: NextRequest) => {
  try {
    const userService = container.resolve<IUserService>('UserService');
    const data = await req.json();
    
    const validationResult = userService.validateCreateUserData(data);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error',
          errors: validationResult.errors,
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const user = await userService.create(data);
    
    return NextResponse.json(
      {
        success: true,
        data: user,
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
        error: error.message || 'Internal Server Error',
        meta: {
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
});
