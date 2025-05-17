/**
 * Enum Utility Functions
 * Provides helper methods for working with enums throughout the application
 */

import { CommonStatus, CustomerType, AppointmentStatus, RequestStatus, NotificationType } from '@/domain/enums/CommonEnums';

/**
 * Type that represents any enum
 */
export type GenericEnum = { [key: string]: string | number };

/**
 * Validates if a value is a valid enum value
 * 
 * @param enumObject The enum to validate against
 * @param value The value to validate
 * @returns Whether the value is valid
 */
export function isValidEnumValue<T extends GenericEnum>(enumObject: T, value: any): value is T[keyof T] {
  if (value === undefined || value === null) {
    return false;
  }
  
  return Object.values(enumObject).includes(value);
}

/**
 * Gets a valid enum value or returns the default
 * 
 * @param enumObject The enum to validate against
 * @param value The value to validate
 * @param defaultValue The default value to return if invalid
 * @returns The validated value or default
 */
export function getValidEnumValue<T extends GenericEnum>(
  enumObject: T, 
  value: any, 
  defaultValue: T[keyof T]
): T[keyof T] {
  if (isValidEnumValue(enumObject, value)) {
    return value as T[keyof T];
  }
  
  return defaultValue;
}

/**
 * Converts a string to a valid enum value or returns the default
 * 
 * @param enumObject The enum to convert to
 * @param value The string value
 * @param defaultValue The default value to use if invalid
 * @returns The enum value
 */
export function stringToEnum<T extends GenericEnum>(
  enumObject: T,
  value: string | undefined,
  defaultValue: T[keyof T]
): T[keyof T] {
  if (!value) {
    return defaultValue;
  }
  
  return getValidEnumValue(enumObject, value, defaultValue);
}

/**
 * Specialized helper for CommonStatus
 */
export function getValidStatus(value: any): CommonStatus {
  return getValidEnumValue(CommonStatus, value, CommonStatus.INACTIVE);
}

/**
 * Specialized helper for CustomerType
 */
export function getValidCustomerType(value: any): CustomerType {
  return getValidEnumValue(CustomerType, value, CustomerType.INDIVIDUAL);
}

/**
 * Specialized helper for AppointmentStatus
 */
export function getValidAppointmentStatus(value: any): AppointmentStatus {
  return getValidEnumValue(AppointmentStatus, value, AppointmentStatus.PLANNED);
}

/**
 * Specialized helper for RequestStatus
 */
export function getValidRequestStatus(value: any): RequestStatus {
  return getValidEnumValue(RequestStatus, value, RequestStatus.NEW);
}

/**
 * Specialized helper for NotificationType
 */
export function getValidNotificationType(value: any): NotificationType {
  return getValidEnumValue(NotificationType, value, NotificationType.INFO);
}
