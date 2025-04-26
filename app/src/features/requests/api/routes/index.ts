/**
 * Export all request API routes
 */

// Import routes with named exports
import { GET as GetRequests } from './get-requests-route';
import { GET as GetRequest } from './get-request-route';
import { POST as CreateRequest } from './create-request-route';
import { POST as AddRequestNote } from './add-request-note-route';
import { POST as CreateAppointment } from './create-appointment-route';
import { POST as ConvertRequest } from './convert-request-route';
import { POST as LinkToCustomer } from './link-to-customer-route';
import { PUT as UpdateRequest } from './update-request-route';
import { PATCH as UpdateRequestStatus } from './update-request-status-route';
import { PATCH as AssignRequest } from './assign-request-route';
import { DELETE as DeleteRequest } from './delete-request-route';

// Re-export with explicit names to avoid ambiguity
export {
  GetRequests,
  GetRequest,
  CreateRequest,
  AddRequestNote,
  CreateAppointment,
  ConvertRequest,
  LinkToCustomer,
  UpdateRequest,
  UpdateRequestStatus,
  AssignRequest,
  DeleteRequest
};

// Export primary HTTP methods for Next.js API routes
export const GET = GetRequests;
export const POST = CreateRequest;
export const PUT = UpdateRequest;
export const PATCH = UpdateRequestStatus;
export const DELETE = DeleteRequest;
