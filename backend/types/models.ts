/**
 * Domain model type definitions
 * These represent the core business entities
 */

// Common types
export interface AuditableEntity {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number | null;
}

// User-related types
export interface UserRecord extends AuditableEntity {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string | null;
  status: string;
  profilePicture?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
}

export interface UserSettingsRecord {
  userId: number;
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  notificationInterval: string;
}

export interface UserActivityRecord {
  id: number;
  userId: number;
  timestamp: Date;
  activity: string;
  ipAddress?: string | null;
}

// Customer-related types
export interface CustomerRecord extends AuditableEntity {
  id: number;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country: string;
  notes?: string | null;
  newsletter: boolean;
  status: string;
  type: string;
}

export interface CustomerLogRecord {
  id: number;
  customerId: number;
  userId?: number | null;
  userName: string;
  action: string;
  details?: string | null;
  createdAt: Date;
}

// Project-related types
export interface ProjectRecord extends AuditableEntity {
  id: number;
  title: string;
  customerId?: number | null;
  serviceId?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  amount?: number | null;
  description?: string | null;
  status: string;
}

export interface ProjectNoteRecord {
  id: number;
  projectId: number;
  userId?: number | null;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface ProjectLogRecord {
  id: number;
  projectId: number;
  userId: number;
  userName: string;
  action: string;
  details?: string | null;
  createdAt: Date;
}

// Appointment-related types
export interface AppointmentRecord extends AuditableEntity {
  id: number;
  title: string;
  customerId?: number | null;
  projectId?: number | null;
  appointmentDate: Date;
  duration?: number | null;
  location?: string | null;
  description?: string | null;
  status: string;
  Customer?: CustomerRecord | null;
  Project?: ProjectRecord | null;
  notes?: AppointmentNoteRecord[];
}

export interface AppointmentNoteRecord {
  id: number;
  appointmentId: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface AppointmentLogRecord {
  id: number;
  appointmentId: number;
  userId: number;
  userName: string;
  action: string;
  details?: string | null;
  createdAt: Date;
}

// Service-related types
export interface ServiceRecord extends AuditableEntity {
  id: number;
  name: string;
  description?: string | null;
  priceBase: number;
  vatRate: number;
  active: boolean;
  unit?: string | null;
}

export interface ServiceLogRecord {
  id: number;
  serviceId: number;
  userId?: number | null;
  userName?: string | null;
  action: string;
  details?: string | null;
  createdAt: Date;
}

// Contact request types
export interface ContactRequestRecord extends AuditableEntity {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  service: string;
  message: string;
  status: string;
  processorId?: number | null;
  ipAddress?: string | null;
}

export interface RequestNoteRecord {
  id: number;
  requestId: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface RequestLogRecord {
  id: number;
  requestId: number;
  userId: number;
  userName: string;
  action: string;
  details?: string | null;
  createdAt: Date;
}

// Notification types
export interface NotificationRecord {
  id: number;
  userId?: number | null;
  referenceId?: number | null;
  referenceType?: string | null;
  type: string;
  title: string;
  message?: string | null;
  description?: string | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}
