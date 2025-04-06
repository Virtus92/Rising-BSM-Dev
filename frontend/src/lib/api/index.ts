/**
 * Zentraler Export aller API-Funktionen
 * Konsistente Benennungen und Gruppierungen sorgen für bessere DX
 */

// Base API client
import apiClient from './client';
export const api = apiClient;

// Re-export API response und error types
export type { ApiResponse, ApiRequestError } from './client';
export { ERROR_MESSAGES } from './client';

// Auth API
export * from './auth';

// Customers API
export * from './customers';

// Projects API
export * from './projects';

// Appointments API - explizite Exporte für bessere Typsicherheit
export {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  addAppointmentNote
} from './appointments';

// Services API
export * from './services';

// Requests API
export * from './requests';

// Notifications API
export * from './notifications';

// Settings API
export * from './settings';

// Datenmodell-Typen für konsistente Verwendung
export type {
  CustomerStatus,
  CustomerType,
  ProjectStatus,
  AppointmentStatus,
  RequestStatus,
  Customer,
  Project,
  Appointment,
  Service,
  Request,
  RequestNote,
  // Response types
  CustomerResponse,
  CustomersResponse,
  ProjectResponse,
  ProjectsResponse,
  AppointmentResponse,
  AppointmentsResponse,
  ServiceResponse,
  ServicesResponse,
  RequestResponse,
  RequestsResponse,
  // Request types
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerStatusUpdateRequest,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectStatusUpdateRequest,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentStatusUpdateRequest,
  ServiceCreateRequest,
  ServiceUpdateRequest,
  ServiceStatusUpdateRequest,
  RequestStatusUpdateRequest,
  RequestAssignRequest,
  RequestNoteCreateRequest,
  // Utility types
  PaginatedList,
  CustomerWithDetails
} from './types';
