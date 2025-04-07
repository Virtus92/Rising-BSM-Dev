/**
 * Appointment entity interface
 * 
 * Domain entity representing an appointment in the system.
 * Aligned with the Prisma schema.
 */
export interface IAppointment {
  /**
   * Appointment ID
   */
  id: number;
  
  /**
   * Appointment title
   */
  title: string;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Project ID
   */
  projectId?: number;
  
  /**
   * Appointment date and time
   */
  appointmentDate: Date;
  
  /**
   * Duration in minutes
   */
  duration?: number;
  
  /**
   * Location
   */
  location?: string;
  
  /**
   * Description
   */
  description?: string;
  
  /**
   * Appointment status
   */
  status: AppointmentStatus;
  
  /**
   * ID of user who created this appointment
   */
  createdBy?: number;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

/**
 * Appointment status enum
 * Aligned with Prisma schema
 */
export enum AppointmentStatus {
  PLANNED = "planned",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  RESCHEDULED = "rescheduled"
}
