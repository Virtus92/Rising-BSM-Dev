import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * POST /api/requests/[id]/notes
 * 
 * Adds a note to a request with proper user information.
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  // Extract the ID from the URL path using regex
  const urlParts = req.nextUrl.pathname.split('/');
  const requestIdIndex = urlParts.findIndex(part => part === 'requests') + 1;
  const id = urlParts[requestIdIndex];
  const requestId = parseInt(id);
  
  if (isNaN(requestId)) {
    return formatResponse.error('Invalid request ID', 400);
  }
  
  // Check permission directly
  const permissionCheck = await permissionMiddleware.checkPermission(req, SystemPermission.REQUESTS_EDIT);
  if (!permissionCheck.success) {
    return formatResponse.forbidden(permissionCheck.message || 'Permission denied', permissionCheck.error);
  }
  
  // Parse request body
  const body = await req.json();
  const { text, content } = body;
  const noteText = text || content; // Support both field names
  
  if (!noteText || noteText.trim() === '') {
    return formatResponse.error('Note text is required', 400);
  }
  
  // Create context for service calls with userId
  const userId = req.auth?.userId || 0;
  const context = {
    userId: userId,
    userRole: req.auth?.role
  };
  
  try {
    // Get request service and user service
    const requestService = serviceFactory.createRequestService();
    const userService = serviceFactory.createUserService();
    
    // Get user information - let it fail properly if there's an issue
    let userName;
    
    if (userId) {
      // Using findById method from IUserService
      const user = await userService.findById(userId);
      if (user && user.name) {
        userName = user.name;
      } else {
        return formatResponse.error('User not found or missing name', 404);
      }
    } else {
      return formatResponse.error('User ID is required', 400);
    }
    
    // Add note with explicit user information
    const newNote = await requestService.addNote(
      requestId,
      userId,
      userName,
      noteText,
      { context }
    );
    
    return formatResponse.success(newNote, 'Note added successfully');
  } catch (error) {
    logger.error('Error adding note to request', {
      error,
      requestId,
      userId: context.userId
    });
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to add note to request',
      500
    );
  }
}, { requiresAuth: true });

/**
 * GET /api/requests/[id]/notes
 * 
 * Retrieves all notes for a request with proper user names.
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  // Extract the ID from the URL path using regex
  const urlParts = req.nextUrl.pathname.split('/');
  const requestIdIndex = urlParts.findIndex(part => part === 'requests') + 1;
  const id = urlParts[requestIdIndex];
  const requestId = parseInt(id);
  
  if (isNaN(requestId)) {
    return formatResponse.error('Invalid request ID', 400);
  }
  
  // Check permission directly
  const permissionCheck = await permissionMiddleware.checkPermission(req, SystemPermission.REQUESTS_VIEW);
  if (!permissionCheck.success) {
    return formatResponse.forbidden(permissionCheck.message || 'Permission denied', permissionCheck.error);
  }
  
  // Create context for service calls
  const context = {
    userId: req.auth?.userId,
    userRole: req.auth?.role
  };
  
  try {
    // Get request service and directly use it for notes
    const requestService = serviceFactory.createRequestService();
    
    // Check if request exists
    const requestEntity = await requestService.findRequestById(requestId, { context });
    if (!requestEntity) {
      return formatResponse.error('Request not found', 404);
    }
    
    // Get notes via the detailed response that includes notes
    const detailedRequest = await requestService.findRequestById(requestId, { context });
    const notes = detailedRequest.notes || [];
    
    // Format notes for response - No fallbacks
    const formattedNotes = notes.map(note => {
      // If userName is missing, let it be null to expose the issue
      return {
        id: note.id,
        requestId: note.requestId,
        userId: note.userId,
        userName: note.userName,
        text: note.text,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt || note.createdAt,
        formattedDate: new Date(note.createdAt).toLocaleString()
      };
    });
    
    return formatResponse.success(formattedNotes, 'Notes retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving notes for request', {
      error,
      requestId,
      userId: context.userId
    });
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to retrieve notes for request',
      500
    );
  }
}, { requiresAuth: true });
