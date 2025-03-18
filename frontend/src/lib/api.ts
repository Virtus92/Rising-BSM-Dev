/**
 * API service to communicate with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    // Try to get error details from the response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ein Fehler ist aufgetreten');
    } catch (error) {
      // If parsing the response fails, throw a generic error with the status
      throw new Error(`API-Fehler: ${response.status}`);
    }
  }
  
  return response.json();
}

// Generic fetch function with error handling
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// API functions

// Auth
export async function login(email: string, password: string) {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return fetchApi('/auth/logout', {
    method: 'POST',
  });
}

// Dashboard
export async function getDashboardStats() {
  return fetchApi('/dashboard/stats');
}

export async function getNotifications() {
  return fetchApi('/dashboard/notifications');
}

// Customers
export async function getCustomers(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/customers${queryString}`);
}

export async function getCustomerById(id: string) {
  return fetchApi(`/customers/${id}`);
}

export async function createCustomer(data: Record<string, any>) {
  return fetchApi('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: Record<string, any>) {
  return fetchApi(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string) {
  return fetchApi(`/customers/${id}`, {
    method: 'DELETE',
  });
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
  return fetchApi(`/appointments${queryString}`);
}

export async function getAppointmentById(id: string) {
  return fetchApi(`/appointments/${id}`);
}

export async function createAppointment(data: Record<string, any>) {
  return fetchApi('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(id: string, data: Record<string, any>) {
  return fetchApi(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateAppointmentStatus(id: string, status: string, note?: string) {
  return fetchApi(`/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
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
  return fetchApi(`/requests${queryString}`);
}

export async function getRequestById(id: string) {
  return fetchApi(`/requests/${id}`);
}

export async function updateRequestStatus(id: string, status: string, note?: string) {
  return fetchApi(`/requests/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
}

// Projects
export async function getProjects(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/projects${queryString}`);
}

export async function getProjectById(id: string) {
  return fetchApi(`/projects/${id}`);
}

export async function createProject(data: Record<string, any>) {
  return fetchApi('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: Record<string, any>) {
  return fetchApi(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateProjectStatus(id: string, status: string, note?: string) {
  return fetchApi(`/projects/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
}

// Services
export async function getServices(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchApi(`/services${queryString}`);
}

export async function getServiceById(id: string) {
  return fetchApi(`/services/${id}`);
}

export async function createService(data: Record<string, any>) {
  return fetchApi('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(id: string, data: Record<string, any>) {
  return fetchApi(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleServiceStatus(id: string, active: boolean) {
  return fetchApi(`/services/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ active }),
  });
}