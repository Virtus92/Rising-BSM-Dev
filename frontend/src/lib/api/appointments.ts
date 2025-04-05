import { get, post, put, del } from './config';
import {
  Appointment,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentStatusUpdateRequest,
  AppointmentResponse,
  AppointmentsResponse
} from './types';

// Helper function to transform backend appointments to frontend format
function transformAppointment(backendAppointment: any): Appointment {
  return {
    id: backendAppointment.id,
    title: backendAppointment.title,
    customerId: backendAppointment.customerId,
    customerName: backendAppointment.customerName,
    projectId: backendAppointment.projectId,
    projectTitle: backendAppointment.projectTitle,
    appointmentDate: backendAppointment.appointmentDate,
    dateFormatted: backendAppointment.dateFormatted,
    appointmentTime: backendAppointment.appointmentTime,
    timeFormatted: backendAppointment.timeFormatted,
    duration: backendAppointment.duration,
    location: backendAppointment.location,
    description: backendAppointment.description,
    status: backendAppointment.status,
    statusLabel: backendAppointment.statusLabel,
    statusClass: backendAppointment.statusClass,
    createdAt: backendAppointment.createdAt,
    updatedAt: backendAppointment.updatedAt
  };
}

// Helper function to transform a list of appointments
function transformAppointments(backendAppointments: any[]): Appointment[] {
  return backendAppointments.map(transformAppointment);
}

/**
 * Gets all appointments with optional filtering and pagination
 */
export function getAppointments(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return get<{appointments: any[]} | any[]>(`/appointments${queryString}`)
    .then(response => {
      if (response.success && response.data) {
        // Behandeln verschiedener API-Antwortstrukturen
        let appointmentsData;
        
        if (Array.isArray(response.data)) {
          // Falls die API direkt ein Array zurückgibt
          appointmentsData = response.data;
          return {
            ...response,
            data: transformAppointments(appointmentsData)
          };
        } else if (response.data.appointments && Array.isArray(response.data.appointments)) {
          // Falls die API ein Objekt mit appointments-Array zurückgibt
          appointmentsData = response.data.appointments;
          const transformedAppointments = transformAppointments(appointmentsData);
          
          return {
            ...response,
            data: {
              appointments: transformedAppointments
            }
          };
        } else {
          // Anderer unerwarteter Datentyp
          console.warn('Unerwartete Datenstruktur in getAppointments API-Antwort', response.data);
          return {
            ...response,
            data: []
          };
        }
      }
      return response;
    });
}

/**
 * Gets an appointment by ID
 */
export function getAppointmentById(id: number | string) {
  return get<{appointment: any}>(`/appointments/${id}`)
    .then(response => {
      if (response.success && response.data && response.data.appointment) {
        // Transform the backend response to frontend format
        const transformedAppointment = transformAppointment(response.data.appointment);
        
        return {
          ...response,
          data: {
            appointment: transformedAppointment
          }
        };
      }
      return response;
    });
}

/**
 * Creates a new appointment
 */
export function createAppointment(data: AppointmentCreateRequest) {
  // No transformation needed as API now uses consistent naming
  
  return post<AppointmentResponse>('/appointments', data);
}

/**
 * Updates an existing appointment
 */
export function updateAppointment(id: number | string, data: AppointmentUpdateRequest) {
  // No transformation needed as API now uses consistent naming
  
  return put<AppointmentResponse>(`/appointments/${id}`, data);
}

/**
 * Updates the status of an appointment
 */
export function updateAppointmentStatus(id: number | string, status: string, note?: string) {
  return put<AppointmentResponse>(`/appointments/${id}/status`, { status, note });
}

/**
 * Deletes an appointment
 */
export function deleteAppointment(id: number | string) {
  return del<{ success: boolean, id: number }>(`/appointments/${id}`);
}

/**
 * Adds a note to an appointment
 */
export function addAppointmentNote(id: number | string, note: string) {
  return post<{ success: boolean }>(`/appointments/${id}/notes`, { note });
}
