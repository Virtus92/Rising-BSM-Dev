import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * POST handler for adding a note to a request
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with created note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Request note creation attempted without authentication');
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }

    // Extract and validate ID from params
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        formatResponse.error('Invalid request ID', 400),
        { status: 400 }
      );
    }

    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.REQUESTS_EDIT
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.REQUESTS_EDIT}`);
      return NextResponse.json(
        formatResponse.error('You don\'t have permission to add notes to requests', 403),
        { status: 403 }
      );
    }

    // Parse request body
    const data = await request.json();

    // Validate note content
    if (!data.content || data.content.trim() === '') {
      return NextResponse.json(
        formatResponse.error('Note content is required', 400),
        { status: 400 }
      );
    }

    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Access user info from session
    const userId = request.auth.userId;
    const userName = request.auth.name || request.auth.email || 'Unknown';
    
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
    return NextResponse.json(
      formatResponse.success(result, 'Note added successfully'),
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error adding request note:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId: params.id
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'An error occurred while adding the note',
        500
      ),
      { status: 500 }
    );
  }
}
