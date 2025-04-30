import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * POST handler for adding a note to a request
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with created note
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract ID from route parameters
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    const session = await authMiddleware(request);
    if (!session) {
      return formatResponse.error('Authentication required', 401);
    }

    // Check if user is authenticated
    if (!session.user) {
      return formatResponse.error('User not authenticated', 401);
    }
    
    // Access user info from session
    const userId = session.user.id;
    const userName = session.user.name || session.user.email || 'Unknown';

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.REQUESTS_EDIT]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data = await request.json();

    // Validate note content
    if (!data.content || data.content.trim() === '') {
      return formatResponse.error('Note content is required', 400);
    }

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();

    // User ID and name are already obtained from the auth session above
    
    const result = await requestService.addNote(
      id,
      userId,
      userName,
      data.content,
      {
        context: {
          userId
        }
      }
    );

    // Return formatted response
    return formatResponse.success(result, 'Note added successfully', 201);
  } catch (error) {
    return formatResponse.error('An error occurred while adding the note', 500);
  }
}
