/**
 * API service to communicate with the backend
 */

import { fetchApi } from './api/config';
import { getAccessToken } from './auth';

// API functions

// Auth
export async function login(email: string, password: string, remember: boolean = false) {
  console.log('Attempting login with email:', email);
  return fetchApi('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember }),
  }, false);
}

export async function logout(refreshToken: string) {
  return fetchApi('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }, true);
}

// Dashboard
export async function getDashboard(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  // Füge alle Parameter zur Query-String hinzu
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  console.log('Getting full dashboard data, authenticated:', !!getAccessToken());
  return fetchApi(`/dashboard${queryString}`, {
    method: 'GET'
  }, true);
}

export async function getDashboardStats() {
  console.log('Getting dashboard stats, authenticated:', !!getAccessToken());
  return fetchApi('/dashboard/stats', {
    method: 'GET'
  }, true);
}

export async function getNotifications() {
  return fetchApi('/notifications', {
    method: 'GET'
  }, true);
}

// Customers
export async function getCustomers<T = any>(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi<T>(`/customers${queryString}`, {
    method: 'GET'
  }, true);
}

export async function getCustomerById<T = any>(id: string) {
  return fetchApi<T>(`/customers/${id}`, {
    method: 'GET'
  }, true);
}

export async function createCustomer<T = any>(data: Record<string, any>) {
  return fetchApi<T>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updateCustomer<T = any>(id: string, data: Record<string, any>) {
  return fetchApi<T>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true);
}

export async function deleteCustomer<T = any>(id: string) {
  return fetchApi<T>(`/customers/${id}`, {
    method: 'DELETE',
  }, true);
}

export async function addCustomerNote(id: string, data: { note: string }) {
  return fetchApi(`/customers/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

// Appointments
export async function getAppointments(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/appointments${queryString}`, {
    method: 'GET'
  }, true);
}

export async function getAppointmentById(id: string) {
  return fetchApi(`/appointments/${id}`, {
    method: 'GET'
  }, true);
}

export async function createAppointment(data: Record<string, any>) {
  return fetchApi('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updateAppointment(id: string, data: Record<string, any>) {
  return fetchApi(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true);
}

export async function updateAppointmentStatus(id: string, status: string, note?: string) {
  return fetchApi(`/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  }, true);
}

// Requests
export async function getRequests(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/requests${queryString}`, {
    method: 'GET'
  }, true);
}

export async function getRequestById(id: string) {
  return fetchApi(`/requests/${id}`, {
    method: 'GET'
  }, true);
}

export async function updateRequestStatus(id: string, status: string, note?: string) {
  return fetchApi(`/requests/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  }, true);
}

// Projects
export async function getProjects<T = any>(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi<T>(`/projects${queryString}`, {
    method: 'GET'
  }, true);
}

export async function getProjectById<T = any>(id: string) {
  return fetchApi<T>(`/projects/${id}`, {
    method: 'GET'
  }, true);
}

export async function createProject<T = any>(data: Record<string, any>) {
  return fetchApi<T>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updateProject<T = any>(id: string, data: Record<string, any>) {
  return fetchApi<T>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true);
}

export async function updateProjectStatus<T = any>(id: string, status: string, note?: string) {
  return fetchApi<T>(`/projects/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  }, true);
}

export async function deleteProject<T = any>(id: string) {
  return fetchApi<T>(`/projects/${id}`, {
    method: 'DELETE',
  }, true);
}

export async function addProjectNote<T = any>(id: string, data: { text: string }) {
  return fetchApi<T>(`/projects/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

// Services
export async function getServices<T = any>(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi<T>(`/services${queryString}`, {
    method: 'GET'
  }, true);
}

export async function getServiceById<T = any>(id: string) {
  return fetchApi<T>(`/services/${id}`, {
    method: 'GET'
  }, true);
}

export async function createService<T = any>(data: Record<string, any>) {
  return fetchApi<T>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updateService<T = any>(id: string, data: Record<string, any>) {
  return fetchApi<T>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true);
}

export async function toggleServiceStatus<T = any>(id: string, active: boolean) {
  return fetchApi<T>(`/services/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ active }),
  }, true);
}

// Invoices
export async function getInvoices<T = any>(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi<T>(`/invoices${queryString}`, {
    method: 'GET'
  }, true);
}

export async function getInvoiceById<T = any>(id: string) {
  return fetchApi<T>(`/invoices/${id}`, {
    method: 'GET'
  }, true);
}

export async function createInvoice<T = any>(data: Record<string, any>) {
  return fetchApi<T>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }, true);
}

export async function updateInvoice<T = any>(id: string, data: Record<string, any>) {
  return fetchApi<T>(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true);
}

export async function deleteInvoice<T = any>(id: string) {
  return fetchApi<T>(`/invoices/${id}`, {
    method: 'DELETE',
  }, true);
}

// Export data endpoints
export async function exportCustomers(format: 'csv' | 'excel' = 'csv', filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/customers/export${queryString}`, {
    method: 'GET',
    headers: {
      'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }, true, true);
}

export async function exportAppointments(format: 'csv' | 'excel' = 'csv', filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/appointments/export${queryString}`, {
    method: 'GET',
    headers: {
      'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }, true, true);
}

export async function exportProjects(format: 'csv' | 'excel' = 'csv', filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/projects/export${queryString}`, {
    method: 'GET',
    headers: {
      'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }, true, true);
}

export async function exportRequests(format: 'csv' | 'excel' = 'csv', filters: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  queryParams.append('format', format);

  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/requests/export${queryString}`, {
    method: 'GET',
    headers: {
      'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }, true, true);
}

export async function sendInvoice<T = any>(id: string, emailData?: { to?: string, message?: string }) {
  return fetchApi<T>(`/invoices/${id}/send`, {
    method: 'POST',
    body: JSON.stringify(emailData || {}),
  }, true);
}

export async function markInvoiceAsPaid<T = any>(id: string, paymentData: { paymentDate: string, paymentMethod: string, note?: string }) {
  return fetchApi<T>(`/invoices/${id}/mark-paid`, {
    method: 'PUT',
    body: JSON.stringify(paymentData),
  }, true);
}

// Settings
export async function getSettings<T = any>() {
  return fetchApi<T>('/settings', {
    method: 'GET'
  }, true);
}

export async function updateSetting<T = any>(key: string, value: any) {
  return fetchApi<T>('/settings', {
    method: 'PUT',
    body: JSON.stringify({ key, value }),
  }, true);
}