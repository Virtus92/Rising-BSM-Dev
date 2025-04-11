/**
 * API route for users
 */
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/infrastructure/services/UserService';
import { authMiddleware } from '../auth/middleware/authMiddleware';
import { responseFormatter } from '@/infrastructure/api/response-formatter';
import { routeHandler } from '@/infrastructure/api/route-handler';
import { UserFilterParamsDto } from '@/domain/dtos/UserDtos';

/**
 * GET /api/users
 * Get users with optional filtering
 */
export async function GET(req: NextRequest) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user) {
      return NextResponse.json(
        responseFormatter.error('Unauthorized'),
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const filterParams: UserFilterParamsDto = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined
    };

    // Mock data for testing until backend is ready
    const mockUsers = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        status: 'active',
        profilePicture: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        status: 'active',
        profilePicture: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'MANAGER',
        status: 'active',
        profilePicture: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Return mock data for now
    return NextResponse.json(
      responseFormatter.success(mockUsers)
    );
  });
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(req: NextRequest) {
  return routeHandler(async () => {
    // Authentication check
    const session = await authMiddleware(req);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        responseFormatter.error('Unauthorized - Admin access required'),
        { status: 403 }
      );
    }

    // Parse request body
    const data = await req.json();

    // Mock successful response
    return NextResponse.json(
      responseFormatter.success({
        id: 4,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }),
      { status: 201 }
    );
  });
}
