/**
 * Appointment Utilities
 * 
 * Helper functions for working with appointment data
 */
import { AppointmentDto, AppointmentDetailResponseDto, AppointmentCustomerData } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { format, isValid, parseISO } from 'date-fns';

/**
 * Interface for standardized customer data
 */
export interface CustomerData {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Gets standardized customer data from an appointment
 * Handles all the different ways customer data can be represented
 * 
 * @param appointment Appointment data object
 * @returns Standardized customer data object
 */
export function getCustomerData(
  appointment: AppointmentDto | AppointmentDetailResponseDto | any
): AppointmentCustomerData | null {
  if (!appointment) return null;
  
  // Check if we have a customer object with proper data
  if (appointment.customer && typeof appointment.customer === 'object') {
    return {
      id: appointment.customer.id || appointment.customerId,
      name: appointment.customer.name || 'Unknown Customer',
      email: appointment.customer.email,
      phone: appointment.customer.phone
    };
  }
  
  // Check if we have a customerData object
  if (appointment.customerData && typeof appointment.customerData === 'object') {
    return {
      id: appointment.customerData.id || appointment.customerId,
      name: appointment.customerData.name || 'Unknown Customer',
      email: appointment.customerData.email,
      phone: appointment.customerData.phone
    };
  }
  
  // Check if we have customerId and customerName
  if (appointment.customerId) {
    return {
      id: appointment.customerId,
      name: appointment.customerName || `Customer ${appointment.customerId}`
    };
  }
  
  // No customer data found
  return null;
}

/**
 * Gets the customer name from an appointment
 * 
 * @param appointment Appointment data object
 * @returns Customer name or default text
 */
export function getCustomerName(
  appointment: AppointmentDto | AppointmentDetailResponseDto | any
): string {
  const customerData = getCustomerData(appointment);
  return customerData ? customerData.name : 'No customer';
}

/**
 * Format a date or date string consistently
 * 
 * @param date Date to format (Date object or string)
 * @param formatString Format pattern
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  formatString: string = 'PP'
): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle various string formats
      if (date.includes('T')) {
        // ISO format
        dateObj = parseISO(date);
      } else if (date.includes('-')) {
        // YYYY-MM-DD format
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else if (date.includes('/')) {
        // MM/DD/YYYY or DD/MM/YYYY format
        const parts = date.split('/');
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else if (parts[2].length === 4) {
          // MM/DD/YYYY or DD/MM/YYYY - assume MM/DD/YYYY
          dateObj = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
        } else {
          // Can't determine format
          return 'Invalid date format';
        }
      } else {
        // Try default parse
        dateObj = new Date(date);
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'Invalid date';
    }
    
    // Make sure the date is valid
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error as Error);
    return 'Invalid date';
  }
}

/**
 * Gets the appropriate CSS class for an appointment status
 * 
 * @param status Appointment status
 * @returns CSS class string
 */
export function getStatusClassName(status?: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case AppointmentStatus.COMPLETED:
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case AppointmentStatus.CANCELLED:
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case AppointmentStatus.RESCHEDULED:
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  }
}

/**
 * Gets a human-readable label for an appointment status
 * 
 * @param status Appointment status
 * @returns Status label
 */
export function getStatusLabel(status?: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.PLANNED:
      return 'Planned';
    case AppointmentStatus.CONFIRMED:
      return 'Confirmed';
    case AppointmentStatus.COMPLETED:
      return 'Completed';
    case AppointmentStatus.CANCELLED:
      return 'Cancelled';
    case AppointmentStatus.RESCHEDULED:
      return 'Rescheduled';
    default:
      return status || 'Unknown';
  }
}

/**
 * Safely extracts a date object from appointment data
 * 
 * @param appointment Appointment data
 * @returns JavaScript Date object
 */
export function getAppointmentDate(appointment: AppointmentDto | any): Date {
  if (!appointment) return new Date();
  
  try {
    if (appointment.appointmentDate) {
      if (appointment.appointmentDate instanceof Date) {
        return appointment.appointmentDate;
      }
      
      // Handle string dates
      if (typeof appointment.appointmentDate === 'string') {
        // Try parsing ISO format first
        if (appointment.appointmentDate.includes('T')) {
          const date = parseISO(appointment.appointmentDate);
          if (isValid(date)) {
            return date;
          }
        }
        
        // Try YYYY-MM-DD format
        if (appointment.appointmentDate.includes('-') && appointment.appointmentDate.split('-').length === 3) {
          const [year, month, day] = appointment.appointmentDate.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          
          // If there's appointmentTime, combine them
          if (appointment.appointmentTime && typeof appointment.appointmentTime === 'string') {
            const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
            date.setHours(hours, minutes);
          }
          
          if (isValid(date)) {
            return date;
          }
        }
        
        // Last resort - try regular Date constructor
        const date = new Date(appointment.appointmentDate);
        if (isValid(date)) {
          return date;
        }
      }
    }
    throw new Error('Invalid appointment date format');
  } catch (error) {
    console.error('Error parsing appointment date:', error as Error);
    return new Date();
  }
}

/**
 * Gets formatted date and time for an appointment
 * 
 * @param appointment Appointment data
 * @returns Formatted date and time string
 */
export function getFormattedDateTime(appointment: AppointmentDto | any): string {
  try {
    const dateObj = getAppointmentDate(appointment);
    
    // Format the date
    const dateString = formatDate(dateObj);
    
    // Get time either from the appointmentTime field or from the date
    const timeString = appointment.appointmentTime || 
      format(dateObj, 'p');
    
    return `${dateString} at ${timeString}`;
  } catch (error) {
    console.error('Error formatting appointment date and time:', error as Error);
    return 'Invalid date';
  }
}
