/**
 * Response DTO Factory Utilities
 * 
 * Provides standardized factory functions for creating response DTOs
 * with all required properties to avoid type errors.
 */

import { 
  UserResponseDto
} from '@/domain/dtos/UserDtos';

import {
  CustomerResponseDto,
  CustomerDetailResponseDto
} from '@/domain/dtos/CustomerDtos';

import {
  RequestResponseDto,
  RequestDetailResponseDto
} from '@/domain/dtos/RequestDtos';

import {
  NotificationResponseDto
} from '@/domain/dtos/NotificationDtos';

import {
  PermissionResponseDto
} from '@/domain/dtos/PermissionDtos';

import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import { CommonStatus, CustomerType, RequestStatus, NotificationType, RequestType } from '@/domain/enums/CommonEnums';

/**
 * Create a complete UserResponseDto with all required properties
 * 
 * @param partial Partial UserResponseDto data
 * @returns Complete UserResponseDto
 */
export function createUserResponseDto(partial: Partial<UserResponseDto> = {}): UserResponseDto {
  return {
    id: partial.id ?? 0,
    name: partial.name ?? '',
    email: partial.email ?? '',
    role: partial.role ?? UserRole.USER,
    status: partial.status ?? UserStatus.INACTIVE,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
    lastLoginAt: partial.lastLoginAt ?? undefined,
    phone: partial.phone ?? undefined,
    permissions: partial.permissions ?? []
  };
}

/**
 * Create a complete CustomerResponseDto with all required properties
 * 
 * @param partial Partial CustomerResponseDto data
 * @returns Complete CustomerResponseDto
 */
export function createCustomerResponseDto(partial: Partial<CustomerResponseDto> = {}): CustomerResponseDto {
  return {
    id: partial.id ?? 0,
    name: partial.name ?? '',
    email: partial.email ?? undefined,
    phone: partial.phone ?? undefined,
    postalCode: partial.postalCode ?? '',
    country: partial.country ?? '',
    newsletter: partial.newsletter ?? false,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
    address: partial.address ?? '',
    city: partial.city ?? '',
    status: partial.status ?? CommonStatus.INACTIVE,
    createdBy: partial.createdBy ?? 0,
    updatedBy: partial.updatedBy ?? 0,

    type: partial.type ?? CustomerType.INDIVIDUAL,
    // Optional fields
    notes: partial.notes ?? [],
    appointments: partial.appointments ?? []
  };
}

/**
 * Create a complete RequestResponseDto with all required properties
 * 
 * @param partial Partial RequestResponseDto data
 * @returns Complete RequestResponseDto
 */
export function createRequestResponseDto(partial: Partial<RequestResponseDto> = {}): RequestResponseDto {
  return {
    id: partial.id ?? 0,
    name: partial.name ?? '',
    email: partial.email ?? '',
    phone: partial.phone ?? undefined,
    message: partial.message ?? '',
    service: partial.service ?? '',
    status: partial.status ?? RequestStatus.NEW,
    type: partial.type ?? RequestType.GENERAL,
    source: partial.source ?? undefined,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
    customerId: partial.customerId ?? undefined,
    processorId: partial.processorId ?? undefined,
    appointmentId: partial.appointmentId ?? undefined,
    // Optional fields
    customerName: partial.customerName ?? undefined,
    processorName: partial.processorName ?? undefined
  };
}

/**
 * Create a complete NotificationResponseDto with all required properties
 * 
 * @param partial Partial NotificationResponseDto data
 * @returns Complete NotificationResponseDto
 */
export function createNotificationResponseDto(partial: Partial<NotificationResponseDto> = {}): NotificationResponseDto {
  return {
    id: partial.id ?? 0,
    userId: partial.userId ?? 0,
    title: partial.title ?? '',
    content: partial.content ?? '',
    message: partial.message ?? '',
    type: partial.type ?? NotificationType.INFO,
    isRead: partial.isRead ?? false,
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString(),
    link: partial.link ?? undefined,
    customerId: partial.customerId ?? undefined,
    appointmentId: partial.appointmentId ?? undefined,
    contactRequestId: partial.contactRequestId ?? undefined
  };
}

/**
 * Create a complete PermissionResponseDto with all required properties
 * 
 * @param partial Partial PermissionResponseDto data
 * @returns Complete PermissionResponseDto
 */
export function createPermissionResponseDto(partial: Partial<PermissionResponseDto> = {}): PermissionResponseDto {
  return {
    id: partial.id ?? 0,
    code: partial.code ?? '',
    name: partial.name ?? '',
    description: partial.description ?? '',
    category: partial.category ?? 'general',
    createdAt: partial.createdAt || new Date().toISOString(),
    updatedAt: partial.updatedAt || new Date().toISOString()
  };
}
