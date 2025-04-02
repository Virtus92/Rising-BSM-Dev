import { fetchApi } from './config';
import { Appointment, AppointmentCreate, AppointmentUpdate, AppointmentWithDetails } from '@/types/appointments';

export function getAppointments(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi<Appointment[]>(`/appointments${queryString}`);
}

export function getAppointmentById(id: number | string) {
  return fetchApi<AppointmentWithDetails>(`/appointments/${id}`);
}

export function createAppointment(data: AppointmentCreate) {
  return fetchApi<Appointment>(
    '/appointments',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export function updateAppointment(id: number | string, data: AppointmentUpdate) {
  return fetchApi<Appointment>(
    `/appointments/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

export function updateAppointmentStatus(id: number | string, status: string, note?: string) {
  return fetchApi(
    `/appointments/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }
  );
}

export function deleteAppointment(id: number | string) {
  return fetchApi(
    `/appointments/${id}`,
    {
      method: 'DELETE',
    }
  );
}

export function addAppointmentNote(id: number | string, note: string) {
  return fetchApi(
    `/appointments/${id}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    }
  );
}
