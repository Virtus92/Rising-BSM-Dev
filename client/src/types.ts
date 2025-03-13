export type StatusType = 
  | 'geplant' 
  | 'bestaetigt' 
  | 'abgeschlossen' 
  | 'storniert'
  | 'neu'
  | 'in_bearbeitung'
  | 'beantwortet'
  | 'geschlossen';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'mitarbeiter';
}

export interface Customer {
  id: number;
  type: 'privat' | 'business';
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  status: 'aktiv' | 'inaktiv' | 'geloescht';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  amount: number;
  status: 'neu' | 'in_bearbeitung' | 'abgeschlossen' | 'storniert';
  statusLabel: string;
  statusClass: string;
  customer_id: number;
  customer_name: string;
  service_id?: number;
  service_name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  titel: string;
  kunde_id: number;
  kunde_name: string;
  projekt_id?: number;
  projekt_titel?: string;
  termin_datum: string;
  dateFormatted: string;
  timeFormatted: string;
  dauer: number;
  ort: string;
  beschreibung?: string;
  status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
  statusLabel: string;
  statusClass: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  priceBase: number;
  unit: string;
  vatRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  status: 'neu' | 'in_bearbeitung' | 'beantwortet' | 'geschlossen';
  statusLabel: string;
  statusClass: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Notification {
  id: number;
  type: 'anfrage' | 'termin' | 'projekt' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  targetId?: number;
  targetType?: string;
}

export interface Pagination {
  current: number;
  limit: number;
  total: number;
  totalRecords: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  filters?: Record<string, any>;
  message?: string;
}