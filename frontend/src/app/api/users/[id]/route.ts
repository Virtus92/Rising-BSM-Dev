/**
 * User API Route Handler (für spezifische Benutzer-ID)
 */
import { NextRequest } from 'next/server';
import { getUserService } from '@/lib/factories';
import apiResponse from '@/lib/utils/api/unified-response';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/users/[id]
 * Holt einen einzelnen Benutzer
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const userService = getUserService();
    const user = await userService.getUserById(id);
    
    if (!user) {
      return apiResponse.notFound(`User with ID ${id} not found`);
    }
    
    return apiResponse.success(user, 'User retrieved successfully');
  } catch (error) {
    return apiResponse.handleError(error);
  }
}

/**
 * PUT /api/users/[id]
 * Aktualisiert einen Benutzer
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const userData = await request.json();
    
    const userService = getUserService();
    const updatedUser = await userService.updateUser(id, userData);
    
    return apiResponse.success(updatedUser, 'User updated successfully');
  } catch (error) {
    return apiResponse.handleError(error);
  }
}

/**
 * DELETE /api/users/[id]
 * Löscht einen Benutzer
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const userService = getUserService();
    await userService.deleteUser(id);
    
    return apiResponse.noContent();
  } catch (error) {
    return apiResponse.handleError(error);
  }
}

/**
 * PATCH /api/users/[id]
 * Teilweise Aktualisierung eines Benutzers (z.B. Status)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    // Extrahieren der Benutzerinformationen aus den Headers
    const userId = request.headers.get('x-user-id');
    const userService = getUserService();
    
    // Überprüfen, ob es eine Statusaktualisierung ist
    if (updates.status) {
      const updatedUser = await userService.updateUserStatus(
        Number(id),
        updates.status,
        {
          userId: userId ? Number(userId) : undefined,
          ipAddress: request.headers.get('x-forwarded-for') || request.ip
        }
      );
      
      return apiResponse.success(updatedUser, 'User status updated successfully');
    }
    
    // Ansonsten normale Teilaktualisierung durchführen
    const updatedUser = await userService.updateUser(id, updates);
    return apiResponse.success(updatedUser, 'User updated successfully');
  } catch (error) {
    return apiResponse.handleError(error);
  }
}
