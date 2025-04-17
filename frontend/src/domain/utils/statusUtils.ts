/**
 * Utility functions for working with statuses across the application
 */

import { RequestStatus, AppointmentStatus } from '@/domain/enums/CommonEnums';

/**
 * Gets a human-readable label for a request status
 * 
 * @param status The request status enum value
 * @returns A user-friendly status label
 */
export function getRequestStatusLabel(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.NEW:
      return 'New';
    case RequestStatus.IN_PROGRESS:
      return 'In Progress';
    case RequestStatus.COMPLETED:
      return 'Completed';
    case RequestStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Gets a CSS class for styling a request status
 * 
 * @param status The request status enum value
 * @returns A CSS class for styling the status
 */
export function getRequestStatusClass(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.NEW:
      return 'bg-blue-100 text-blue-800';
    case RequestStatus.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800';
    case RequestStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case RequestStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Gets a human-readable label for an appointment status
 * 
 * @param status The appointment status enum value
 * @returns A user-friendly status label
 */
export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.PLANNED:
      return 'Planned';
    case AppointmentStatus.CONFIRMED:
      return 'Confirmed';
    case AppointmentStatus.COMPLETED:
      return 'Completed';
    case AppointmentStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Gets a CSS class for styling an appointment status
 * 
 * @param status The appointment status enum value
 * @returns A CSS class for styling the status
 */
export function getAppointmentStatusClass(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.PLANNED:
      return 'bg-blue-100 text-blue-800';
    case AppointmentStatus.CONFIRMED:
      return 'bg-green-100 text-green-800';
    case AppointmentStatus.COMPLETED:
      return 'bg-purple-100 text-purple-800';
    case AppointmentStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
