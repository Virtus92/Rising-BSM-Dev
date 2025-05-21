/**
 * Entity Factory Utilities
 * 
 * Provides standardized factory functions for creating fully-formed entities
 * with all required properties to avoid type errors.
 */
import { Customer } from '@/domain/entities/Customer';
import { Appointment } from '@/domain/entities/Appointment';
import { CommonStatus, CustomerType, AppointmentStatus, RequestStatus } from '@/domain/enums/CommonEnums';
import { ContactRequest } from '@/domain/entities/ContactRequest';
import { User } from '@/domain/entities/User';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { Notification } from '@/domain/entities/Notification';
import { NotificationType } from '@/domain/enums/CommonEnums';

/**
 * Create a complete Customer entity with all required properties
 * 
 * @param partial Partial Customer data
 * @returns Complete Customer entity
 */
export function createCustomerEntity(partial: Partial<Customer> = {}): Customer {
  const customer = new Customer({
    id: partial.id ?? 0,
    name: partial.name ?? '',
    email: partial.email ?? undefined,
    phone: partial.phone ?? undefined,
    postalCode: partial.postalCode ?? '',
    country: partial.country ?? '',
    newsletter: partial.newsletter ?? false,
    status: partial.status ?? CommonStatus.INACTIVE,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
    address: partial.address ?? '',
    city: partial.city ?? '',
    type: partial.type ?? CustomerType.INDIVIDUAL,
    notes: partial.notes ?? undefined,
    createdBy: partial.createdBy ?? 0,
    updatedBy: partial.updatedBy ?? 0,
    company: partial.company ?? undefined,
    vatNumber: partial.vatNumber ?? undefined,
    state: partial.state ?? undefined,
  });
  return customer;
}

/**
 * Create a complete Appointment entity with all required properties
 * 
 * @param partial Partial Appointment data
 * @returns Complete Appointment entity
 */
export function createAppointmentEntity(partial: Partial<Appointment> = {}): Appointment {
  return new Appointment({
    id: partial.id ?? 0,
    title: partial.title ?? '',
    customerId: partial.customerId ?? undefined,
    appointmentDate: partial.appointmentDate ?? new Date(),
    duration: partial.duration ?? 60,
    location: partial.location ?? '',
    description: partial.description ?? '',
    status: partial.status ?? AppointmentStatus.PLANNED,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
    createdBy: partial.createdBy ?? 0,
    updatedBy: partial.updatedBy ?? 0,
    notes: partial.notes,
    customerName: partial.customerName ?? '',
    customer: partial.customer ? createCustomerEntity(partial.customer) : undefined
  });
}

/**
 * Create a complete Request entity with all required properties
 * 
 * @param partial Partial Request data
 * @returns Complete Request entity
 */
export function createRequestEntity(partial: Partial<ContactRequest> = {}): ContactRequest {
  const request = new ContactRequest({
    id: partial.id ?? 0,
    name: partial.name ?? '',
    email: partial.email ?? '',
    phone: partial.phone ?? undefined,
    message: partial.message ?? '',
    service: partial.service ?? '',
    status: partial.status ?? RequestStatus.NEW,
    source: partial.source ?? undefined,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
    notes: partial.notes,
    customerId: partial.customerId ?? undefined,
    processorId: partial.processorId ?? undefined,
    appointmentId: partial.appointmentId ?? undefined,
    customer: partial.customer ? createCustomerEntity(partial.customer) : undefined,
    processor: partial.processor ? createUserEntity(partial.processor) : undefined,
    appointment: partial.appointment ? createAppointmentEntity(partial.appointment) : undefined,
    createdBy: partial.createdBy ?? 0,
    updatedBy: partial.updatedBy ?? 0,
    ipAddress: partial.ipAddress ?? undefined,
    metadata: partial.metadata ?? undefined,
    requestData: partial.requestData ?? []
  });
  return request;
}

/**
 * Create a complete User entity with all required properties
 * 
 * @param partial Partial User data
 * @returns Complete User entity
 */
export function createUserEntity(partial: Partial<User> = {}): User {
  const user = new User({
    id: partial.id ?? 0,
    name: partial.name ?? '',
    email: partial.email ?? '',
    role: partial.role ?? UserRole.USER,
    status: partial.status ?? UserStatus.INACTIVE,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
    lastLoginAt: partial.lastLoginAt ?? undefined,
    permissions: partial.permissions ?? [],
    phone: partial.phone ?? undefined,
    password: partial.password ?? undefined,
    profilePicture: partial.profilePicture ?? undefined,
    resetToken: partial.resetToken ?? undefined,
    resetTokenExpiry: partial.resetTokenExpiry ?? undefined
  });
  return user;
}

/**
 * Create a complete Notification entity with all required properties
 * 
 * @param partial Partial Notification data
 * @returns Complete Notification entity
 */
export function createNotificationEntity(partial: Partial<Notification> = {}): Notification {
  const notification = new Notification({
    id: partial.id ?? 0,
    userId: partial.userId ?? 0,
    title: partial.title ?? '',
    message: partial.message ?? '',
    type: partial.type ?? NotificationType.INFO,
    isRead: partial.isRead ?? false,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
    link: partial.link ?? undefined,
    customerId: partial.customerId ?? undefined,
    appointmentId: partial.appointmentId ?? undefined,
    contactRequestId: partial.contactRequestId ?? undefined,
    createdBy: partial.createdBy ?? 0,
    updatedBy: partial.updatedBy ?? 0
  });
  return notification;
}
