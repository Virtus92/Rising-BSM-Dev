import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withPermission } from '@/features/permissions/api/middleware/permissionMiddleware';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/notes
 * 
 * Fügt eine Notiz zu einer Kontaktanfrage hinzu.
 */
export const POST = routeHandler(
  withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();

      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Parse request body
      const body = await req.json();
      const { text, content } = body;
      const noteText = text || content; // Support both field names
      
      if (!noteText || noteText.trim() === '') {
        return formatResponse.error('Note text is required', 400);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Add note to request
      const newNote = await requestService.addNote(
        requestId,
        req.auth?.userId || 0,
        req.auth?.name || 'Unknown User',
        noteText,
        { context }
      );
      
      return formatResponse.success(newNote, 'Note added successfully');
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);

/**
 * GET /api/requests/[id]/notes
 * 
 * Ruft alle Notizen einer Kontaktanfrage ab.
 */
export const GET = routeHandler(
  withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
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
      
      // Format notes for response
      const formattedNotes = notes.map(note => ({
        id: note.id,
        requestId: note.requestId,
        userId: note.userId,
        userName: note.userName || 'Unknown User',
        text: note.text,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt || note.createdAt,
        formattedDate: new Date(note.createdAt).toLocaleString()
      }));
      
      return formatResponse.success(formattedNotes, 'Notes retrieved successfully');
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);