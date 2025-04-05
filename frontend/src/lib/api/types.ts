/**
 * Central type definitions for API responses and requests
 * Based on the backend API specification
 */

// Base type for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    pagination?: {
      current: number;
      limit: number;
      total: number;
      totalRecords: number;
    };
    filters?: Record<string, any>;
  };
  error?: string;
}

// Status codes as string literals for type safety
export type CustomerStatus = 'active' | 'inactive' | 'deleted';
export type CustomerType = 'private' | 'business';
export type ProjectStatus = 'neu' | 'in_bearbeitung' | 'abgeschlossen' | 'storniert';
export type AppointmentStatus = 'planned' | 'confirmed' | 'completed' | 'canceled';
export type RequestStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';

// Customer data model
export interface Customer {
  id: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string;
  newsletter: boolean;
  status: CustomerStatus;
  statusLabel: string;
  statusClass: string;
  type: CustomerType;
  typeLabel: string;
  createdAt: string;
  updatedAt: string;
}

// Project data model
export interface Project {
  id: number;
  title: string;
  customerId?: number;
  customerName?: string;
  serviceId?: number;
  serviceName?: string;
  startDate: string;
  endDate?: string;
  amount?: number;
  description?: string;
  status: ProjectStatus;
  statusLabel: string;
  statusClass: string;
  createdAt: string;
  updatedAt: string;
}

// Appointment data model
export interface Appointment {
  id: number;
  title: string;
  customerId?: number;
  customerName?: string;
  projectId?: number;
  projectTitle?: string;
  appointmentDate: string;
  dateFormatted?: string;
  appointmentTime: string;
  timeFormatted?: string;
  duration: number;
  location?: string;
  description?: string;
  status: AppointmentStatus;
  statusLabel?: string;
  statusClass?: string;
  createdAt: string;
  updatedAt: string;
}

// Service data model
export interface Service {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  active: boolean;
  category?: string;
  durationInMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

// Request data model
export interface Request {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  service?: string;
  serviceId?: number;
  status: RequestStatus;
  statusLabel?: string;
  statusClass?: string;
  processorId?: number;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

// Request note data model
export interface RequestNote {
  id: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
  requestId: number;
  formattedDate?: string;
}

// Standard response interfaces
export interface CustomerResponse {
  customer: Customer;
}

export interface CustomersResponse {
  customers: Customer[];
}

export interface ProjectResponse {
  project: Project;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface AppointmentResponse {
  appointment: Appointment;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
}

export interface ServiceResponse {
  service: Service;
}

export interface ServicesResponse {
  services: Service[];
}

export interface RequestResponse {
  request: Request;
  notes?: RequestNote[];
}

export interface RequestsResponse {
  requests: Request[];
  notes?: Record<number, RequestNote[]>;
}

// Standard request interfaces
export interface CustomerCreateRequest {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string;
  newsletter?: boolean;
  status?: CustomerStatus;
  type?: CustomerType;
}

export interface CustomerUpdateRequest {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string;
  newsletter?: boolean;
  status?: CustomerStatus;
  type?: CustomerType;
}

export interface CustomerStatusUpdateRequest {
  status: CustomerStatus;
  note?: string;
}

export interface ProjectCreateRequest {
  title: string;
  customerId?: number;
  serviceId?: number;
  startDate: string;
  endDate?: string;
  amount?: number;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectUpdateRequest {
  title?: string;
  customerId?: number;
  serviceId?: number;
  startDate?: string;
  endDate?: string;
  amount?: number;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectStatusUpdateRequest {
  status: ProjectStatus;
  note?: string;
}

export interface AppointmentCreateRequest {
  title: string;
  customerId?: number;
  projectId?: number;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  location?: string;
  description?: string;
  status?: AppointmentStatus;
}

export interface AppointmentUpdateRequest {
  title?: string;
  customerId?: number;
  projectId?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: number;
  location?: string;
  description?: string;
  status?: AppointmentStatus;
}

export interface AppointmentStatusUpdateRequest {
  status: AppointmentStatus;
  note?: string;
}

export interface ServiceCreateRequest {
  name: string;
  description?: string;
  basePrice: number;
  active?: boolean;
  category?: string;
  durationInMinutes?: number;
}

export interface ServiceUpdateRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  active?: boolean;
  category?: string;
  durationInMinutes?: number;
}

export interface ServiceStatusUpdateRequest {
  active: boolean;
}

export interface RequestStatusUpdateRequest {
  status: RequestStatus;
  processorId?: number;
}

export interface RequestAssignRequest {
  processorId: number;
}

export interface RequestNoteCreateRequest {
  text: string;
}

// Paginated list
export interface PaginatedList<T> {
  items: T[];
  pagination: {
    current: number;
    limit: number;
    total: number;
    totalRecords: number;
  };
}

// Customer with additional details
export interface CustomerWithDetails {
  id: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string;
  newsletter: boolean;
  status: CustomerStatus;
  statusLabel: string;
  statusClass: string;
  type: CustomerType;
  typeLabel: string;
  createdAt: string;
  updatedAt: string;
  // Additional details fields
  customerNotes?: Array<{
    id: number;
    text: string;
    userId: number;
    userName: string;
    createdAt: string;
    formattedDate?: string;
  }>;
  projects?: Array<{
    id: number;
    title: string;
    startDate: string;
    status: string;
    statusLabel?: string;
    statusClass?: string;
  }>;
  appointments?: Array<{
    id: number;
    title: string;
    appointmentDate: string;
    status: string;
    statusLabel?: string;
    statusClass?: string;
  }>;
}
