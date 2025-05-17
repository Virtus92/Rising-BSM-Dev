import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { withPermission } from '@/app/api/middleware';
import { formatResponse } from '@/core/errors';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * POST handler for adding a note to a request
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with created note
 */
export const POST = withAuth(
  async (request: NextRequest, user: any) => {
    // Extract params from request URL
    const id = Number(request.url.split('/')[request.url.split('/').indexOf('notes') - 1]);
    
    // Create a permission handler
    const permissionHandler = async (req: NextRequest, user: any) => {
        try {
          // Validate ID from URL
          if (isNaN(id) || id <= 0) {
            return formatResponse.error('Invalid request ID', 400);
          }
          
          // Parse request body
          const data = await req.json();

          // Validate note content
          if (!data.content || data.content.trim() === '') {
            return formatResponse.error('Note content is required', 400);
          }

          // Get request service
          const serviceFactory = getServiceFactory();
          const requestService = serviceFactory.createRequestService();
          
          // Access user info from session
          const userId = user.id;
          const userName = user.name || user.email || 'Unknown';
          
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
          return formatResponse.error(
            error instanceof Error ? error.message : 'An error occurred while adding the note', 
            500
          );
        }
      }
      (SystemPermission.REQUESTS_EDIT)
    
    // Apply permission middleware with proper signature
    const handler = await withPermission(permissionHandler, SystemPermission.REQUESTS_EDIT);
    return await handler(request);
  }
);
