import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/server/di-container';
import { IUserService } from '@/lib/server/interfaces/IUserService';
import { withAuth, withRoles } from '@/lib/server/core/auth';

/**
 * GET /api/users/[id]
 * Gibt einen Benutzer anhand seiner ID zurück
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // Prüfen, ob der Benutzer nur seine eigenen Daten anfragt oder Admin/Manager ist
    if (user.id !== id && !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You can only access your own user data',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 403 }
      );
    }
    
    const userService = container.resolve<IUserService>('UserService');
    const userData = await userService.findById(id);
    
    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: userData,
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
 * PUT /api/users/[id]
 * Aktualisiert einen Benutzer
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    // Prüfen, ob der Benutzer nur seine eigenen Daten aktualisiert oder Admin ist
    const isAdmin = user.role === 'admin';
    const isSelf = user.id === id;
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You can only update your own user data',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    
    // Normale Benutzer dürfen ihre Rolle nicht ändern
    if (!isAdmin && data.role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You cannot change your role',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 403 }
      );
    }
    
    const userService = container.resolve<IUserService>('UserService');
    
    const validationResult = userService.validateUpdateUserData(data);
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
    
    const updatedUser = await userService.update(id, data);
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
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
 * DELETE /api/users/[id]
 * Löscht einen Benutzer (nur für Admin)
 */
export const DELETE = withRoles(['admin'], async (req: NextRequest) => {
  try {
    const id = parseInt(req.url.split('/').pop() || '0');
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid user ID',
          meta: {
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    const userService = container.resolve<IUserService>('UserService');
    await userService.delete(id);
    
    return NextResponse.json({
      success: true,
      data: null,
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
