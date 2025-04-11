/**
 * API route for specific user operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '../../auth/middleware/authMiddleware';
import { responseFormatter } from '@/infrastructure/api/response-formatter';
import { routeHandler } from '@/infrastructure/api/route-handler';

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user) {
      return NextResponse.json(
        responseFormatter.error('Unauthorized'),
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        responseFormatter.error('Invalid user ID'),
        { status: 400 }
      );
    }

    // Mock user data
    const mockUser = {
      id: id,
      name: id === 1 ? 'Admin User' : id === 2 ? 'John Doe' : 'Jane Smith',
      email: id === 1 ? 'admin@example.com' : id === 2 ? 'john@example.com' : 'jane@example.com',
      role: id === 1 ? 'ADMIN' : id === 3 ? 'MANAGER' : 'USER',
      status: 'active',
      profilePicture: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(
      responseFormatter.success(mockUser)
    );
  });
}

/**
 * PUT /api/users/[id]
 * Update a user
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user) {
      return NextResponse.json(
        responseFormatter.error('Unauthorized'),
        { status: 401 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        responseFormatter.error('Invalid user ID'),
        { status: 400 }
      );
    }

    // Parse request body
    const data = await req.json();

    // Mock updated user
    const updatedUser = {
      id: id,
      ...data,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(
      responseFormatter.success(updatedUser)
    );
  });
}

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        responseFormatter.error('Unauthorized - Admin access required'),
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        responseFormatter.error('Invalid user ID'),
        { status: 400 }
      );
    }

    // Mock successful deletion
    return NextResponse.json(
      responseFormatter.success({ success: true })
    );
  });
}
