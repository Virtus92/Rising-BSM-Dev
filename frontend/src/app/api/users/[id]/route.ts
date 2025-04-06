/**
 * User API Route Handler für spezifische Benutzer-ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserService } from '@/lib/services/factory';
import { successResponse, noContentResponse } from '@/lib/utils/api/response';
import { ApiError, NotFoundError } from '@/lib/utils/api/error';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/users/[id]
 * Einzelnen Benutzer abrufen
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const userService = getUserService();
    const user = await userService.getUserById(id);
    
    if (!user) {
      throw new NotFoundError(`Benutzer mit ID ${id} nicht gefunden`);
    }
    
    return successResponse(user);
  } catch (error) {
    return ApiError.handleError(error);
  }
}

/**
 * PUT /api/users/[id]
 * Benutzer aktualisieren
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const userData = await request.json();
    
    const userService = getUserService();
    const updatedUser = await userService.updateUser(id, userData);
    
    return successResponse(updatedUser);
  } catch (error) {
    return ApiError.handleError(error);
  }
}

/**
 * DELETE /api/users/[id]
 * Benutzer löschen
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const userService = getUserService();
    await userService.deleteUser(id);
    
    return noContentResponse();
  } catch (error) {
    return ApiError.handleError(error);
  }
}