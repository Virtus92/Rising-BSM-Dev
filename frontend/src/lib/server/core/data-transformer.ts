/**
 * Data Transformer Utility
 * 
 * Diese Utility-Klasse bietet Funktionen zur Transformation von Daten zwischen 
 * Datenbank-Modellen und API-Repräsentationen.
 */

import { formatDate, formatTime } from '@/lib/utils/date-formatter';
import { getStatusClass, getStatusLabel } from '@/lib/utils/status-formatter';
import type { Appointment, Customer, Project, Request, RequestNote, Service } from '@prisma/client';

/**
 * Transformiert ein Appointment aus der Datenbank in ein API-Format.
 */
export const transformAppointment = (appointment: any) => {
  return {
    id: appointment.id,
    title: appointment.title,
    customerId: appointment.customerId,
    customerName: getCustomerName(appointment),
    projectId: appointment.projectId,
    projectTitle: appointment.project?.title,
    appointmentDate: appointment.appointmentDate,
    dateFormatted: formatDate(appointment.appointmentDate, false),
    appointmentTime: appointment.appointmentTime,
    timeFormatted: formatTime(appointment.appointmentTime),
    duration: appointment.duration,
    location: appointment.location || '',
    description: appointment.description || '',
    status: appointment.status,
    statusLabel: getStatusLabel(appointment.status, 'appointment'),
    statusClass: getStatusClass(appointment.status, 'appointment'),
    createdAt: appointment.created_at,
    updatedAt: appointment.updated_at,
    notes: transformNotes(appointment.notes || [])
  };
};

/**
 * Hilfsfunktion um den Kundennamen aus einem Appointment zu extrahieren,
 * unabhängig davon, wie die Kundeninformation vorhanden ist.
 */
const getCustomerName = (appointment: any): string => {
  if (appointment.customerName) {
    return appointment.customerName;
  }
  
  if (typeof appointment.customer === 'string') {
    return appointment.customer;
  }
  
  if (appointment.customer?.name) {
    return appointment.customer.name;
  }
  
  return 'Kein Kunde zugewiesen';
};

/**
 * Transformiert eine Reihe von Appointments 
 */
export const transformAppointments = (appointments: any[]) => {
  return appointments.map(transformAppointment);
};

/**
 * Transformiert Notizen
 */
export const transformNotes = (notes: any[]) => {
  return notes.map(note => ({
    id: note.id,
    text: note.text,
    userId: note.userId,
    userName: note.userName,
    createdAt: note.created_at || note.createdAt,
    formattedDate: formatDate(note.created_at || note.createdAt, true)
  }));
};

/**
 * Transformiert einen Kunden
 */
export const transformCustomer = (customer: any) => {
  return {
    id: customer.id,
    name: customer.name,
    company: customer.company_name || customer.company || '',
    email: customer.email,
    phone: customer.phone || '',
    address: customer.street || '',
    postalCode: customer.postal_code || customer.postalCode || '',
    city: customer.city || '',
    country: customer.country || '',
    notes: customer.notes || '',
    newsletter: customer.newsletter || false,
    status: customer.status,
    statusLabel: getStatusLabel(customer.status, 'customer'),
    statusClass: getStatusClass(customer.status, 'customer'),
    type: customer.type,
    typeLabel: customer.type === 'business' ? 'Geschäftskunde' : 'Privatkunde',
    createdAt: customer.created_at || customer.createdAt,
    updatedAt: customer.updated_at || customer.updatedAt
  };
};

/**
 * Transformiert mehrere Kunden
 */
export const transformCustomers = (customers: any[]) => {
  return customers.map(transformCustomer);
};

/**
 * Transformiert ein Projekt
 */
export const transformProject = (project: any) => {
  return {
    id: project.id,
    title: project.title,
    customerId: project.customerId,
    customerName: project.customer?.name || 'Kein Kunde',
    serviceId: project.serviceId,
    serviceName: project.service?.name || 'Keine Leistung',
    startDate: project.startDate,
    endDate: project.endDate || null,
    amount: project.amount || 0,
    description: project.description || '',
    status: project.status,
    statusLabel: getStatusLabel(project.status, 'project'),
    statusClass: getStatusClass(project.status, 'project'),
    createdAt: project.created_at || project.createdAt,
    updatedAt: project.updated_at || project.updatedAt
  };
};

/**
 * Transformiert mehrere Projekte
 */
export const transformProjects = (projects: any[]) => {
  return projects.map(transformProject);
};

/**
 * Transformiert eine Anfrage
 */
export const transformRequest = (request: any) => {
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    status: request.status,
    statusLabel: getStatusLabel(request.status, 'request'),
    statusClass: getStatusClass(request.status, 'request'),
    priority: request.priority,
    customerId: request.customerId,
    customerName: request.customer?.name || 'Kein Kunde',
    assignedUserId: request.assignedUserId,
    assignedUserName: request.assignedUser?.name || null,
    createdAt: request.created_at || request.createdAt,
    updatedAt: request.updated_at || request.updatedAt,
    notes: transformNotes(request.notes || [])
  };
};

/**
 * Transformiert mehrere Anfragen
 */
export const transformRequests = (requests: any[]) => {
  return requests.map(transformRequest);
};

/**
 * Transformiert eine Leistung
 */
export const transformService = (service: any) => {
  return {
    id: service.id,
    name: service.name,
    description: service.description || '',
    basePrice: service.basePrice || 0,
    active: service.active,
    category: service.category || '',
    durationInMinutes: service.durationInMinutes || 0,
    createdAt: service.created_at || service.createdAt,
    updatedAt: service.updated_at || service.updatedAt
  };
};

/**
 * Transformiert mehrere Leistungen
 */
export const transformServices = (services: any[]) => {
  return services.map(transformService);
};

/**
 * Export der zentralen Transformer-Funktionen
 */
export const DataTransformer = {
  appointment: transformAppointment,
  appointments: transformAppointments,
  customer: transformCustomer,
  customers: transformCustomers,
  project: transformProject,
  projects: transformProjects,
  request: transformRequest,
  requests: transformRequests,
  service: transformService,
  services: transformServices,
  notes: transformNotes
};

export default DataTransformer;
