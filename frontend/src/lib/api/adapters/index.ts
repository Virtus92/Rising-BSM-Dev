/**
 * Adapter functions for transforming backend data into TypeScript types
 * 
 * These functions help with the conversion between backend data structures (with
 * potentially inconsistent names like kunde_id, titel, etc.) and the consistent
 * frontend data structures (customerId, title, etc.).
 */

import { Appointment, Customer, Project, Service, Request } from '@/lib/api/types';

/**
 * Converts backend appointments to frontend Appointment objects
 */
export function adaptAppointment(backendData: any): Appointment {
  return {
    id: backendData.id,
    title: backendData.titel || backendData.title || '',
    customerId: backendData.kunde_id || backendData.customerId || null,
    customerName: backendData.kunde_name || (backendData.customer?.name) || '',
    projectId: backendData.projekt_id || backendData.projectId || null,
    projectTitle: backendData.projekt_titel || backendData.projectTitle || '',
    appointmentDate: backendData.termin_datum || backendData.date || backendData.appointmentDate || '',
    appointmentTime: backendData.termin_zeit || backendData.time || backendData.appointmentTime || '',
    dateFormatted: backendData.dateFormatted || backendData.formattedDate || '',
    timeFormatted: backendData.timeFormatted || '',
    duration: backendData.dauer || backendData.duration || 0,
    location: backendData.ort || backendData.location || null,
    description: backendData.beschreibung || backendData.description || null,
    status: backendData.status || 'planned',
    statusLabel: backendData.statusLabel || '',
    statusClass: backendData.statusClass || '',
    createdAt: backendData.created_at || backendData.createdAt || '',
    updatedAt: backendData.updated_at || backendData.updatedAt || ''
  };
}

/**
 * Converts backend customers to frontend Customer objects
 */
export function adaptCustomer(backendData: any): Customer {
  return {
    id: backendData.id,
    name: backendData.name || '',
    company: backendData.company || backendData.firma || '',
    email: backendData.email || '',
    phone: backendData.phone || backendData.telefon || '',
    address: backendData.address || backendData.adresse || '',
    postalCode: backendData.postalCode || backendData.plz || '',
    city: backendData.city || backendData.ort || '',
    country: backendData.country || backendData.land || 'Austria',
    notes: backendData.notes || backendData.notizen || '',
    newsletter: typeof backendData.newsletter === 'boolean' ? backendData.newsletter : false,
    status: backendData.status || 'active',
    statusLabel: backendData.statusLabel || '',
    statusClass: backendData.statusClass || '',
    type: backendData.type || 'private',
    typeLabel: backendData.typeLabel || '',
    createdAt: backendData.created_at || backendData.createdAt || '',
    updatedAt: backendData.updated_at || backendData.updatedAt || ''
  };
}

/**
 * Converts backend projects to frontend Project objects
 */
export function adaptProject(backendData: any): Project {
  return {
    id: backendData.id,
    title: backendData.title || backendData.titel || '',
    customerId: backendData.kunde_id || backendData.customerId || null,
    customerName: backendData.kunde_name || backendData.customerName || '',
    serviceId: backendData.leistung_id || backendData.serviceId || null,
    serviceName: backendData.leistung_name || backendData.serviceName || '',
    startDate: backendData.start_datum || backendData.startDate || '',
    endDate: backendData.end_datum || backendData.endDate || null,
    amount: backendData.betrag || backendData.amount || null,
    description: backendData.beschreibung || backendData.description || '',
    status: backendData.status || 'neu',
    statusLabel: backendData.statusLabel || '',
    statusClass: backendData.statusClass || '',
    createdAt: backendData.created_at || backendData.createdAt || '',
    updatedAt: backendData.updated_at || backendData.updatedAt || ''
  };
}

/**
 * Converts backend services to frontend Service objects
 */
export function adaptService(backendData: any): Service {
  return {
    id: backendData.id,
    name: backendData.name || '',
    description: backendData.description || backendData.beschreibung || '',
    basePrice: backendData.basePrice || backendData.preis || 0,
    active: typeof backendData.active === 'boolean' ? backendData.active : true,
    category: backendData.category || backendData.kategorie || '',
    durationInMinutes: backendData.durationInMinutes || backendData.dauer || 0,
    createdAt: backendData.created_at || backendData.createdAt || '',
    updatedAt: backendData.updated_at || backendData.updatedAt || ''
  };
}

/**
 * Converts backend requests to frontend Request objects
 */
export function adaptRequest(backendData: any): Request {
  return {
    id: backendData.id,
    name: backendData.name || '',
    email: backendData.email || '',
    phone: backendData.phone || backendData.telefon || '',
    message: backendData.message || backendData.nachricht || '',
    service: backendData.service || backendData.leistung || '',
    serviceId: backendData.serviceId || backendData.leistung_id || null,
    status: backendData.status || 'new',
    statusLabel: backendData.statusLabel || '',
    statusClass: backendData.statusClass || '',
    processorId: backendData.processorId || backendData.bearbeiter_id || null,
    ipAddress: backendData.ipAddress || backendData.ip_adresse || '',
    createdAt: backendData.created_at || backendData.createdAt || '',
    updatedAt: backendData.updated_at || backendData.updatedAt || ''
  };
}
