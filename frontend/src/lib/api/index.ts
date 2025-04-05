// Re-export all API services and functions

// Config
export * from './config';

// Auth API
export * from './auth';

// Customers API
export * from './customers';

// Projects API
export * from './projects';

// Appointments API
export * from './appointments';

// Services API
export * from './services';

// Requests API
export * from './requests';

// Notifications API
export * from './notifications';

// Types - import and re-export with different name to avoid conflicts
import * as ApiTypes from './types';
export { ApiTypes };

// Also export common types that don't conflict
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
  PaginatedList,
  CustomerWithDetails
} from './types';
