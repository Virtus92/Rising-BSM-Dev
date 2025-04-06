/**
 * Appointment entity
 * 
 * Domain entity representing an appointment in the system.
 * Aligned with the Prisma schema.
 */
export class Appointment {
  /**
   * Appointment ID
   */
  id: number;
  
  /**
   * Appointment title
   */
  title: string;
  
  /**
   * Customer ID (optional)
   */
  customerId?: number;
  
  /**
   * Project ID (optional)
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
   * Appointment location
   */
  location?: string;
  
  /**
   * Appointment description
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
  
  /**
   * Appointment notes (populated by relation)
   */
  notes?: any[];

  /**
   * Creates a new Appointment instance
   * 
   * @param data - Appointment data
   */
  constructor(data: Partial<Appointment> = {}) {
    this.id = data.id || 0;
    this.title = data.title || '';
    this.customerId = data.customerId;
    this.projectId = data.projectId;
    this.appointmentDate = data.appointmentDate || new Date();
    this.duration = data.duration;
    this.location = data.location;
    this.description = data.description;
    this.status = data.status || AppointmentStatus.PLANNED;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.notes = data.notes || [];
  }

  /**
   * Get ISO date string (YYYY-MM-DD)
   * 
   * @returns ISO date string
   */
  getISODate(): string {
    return this.appointmentDate.toISOString().split('T')[0];
  }

  /**
   * Get ISO time string (HH:MM)
   * 
   * @returns ISO time string
   */
  getISOTime(): string {
    return this.appointmentDate.toISOString().split('T')[1].substring(0, 5);
  }

  /**
   * Check if appointment is in the future
   * 
   * @returns Whether appointment is in the future
   */
  isFuture(): boolean {
    return this.appointmentDate > new Date();
    // Note: This method is kept as-is since there's no equivalent in datetime-helper
    // For consistency, a future improvement would be to add a datetime.isFuture() method
  }

  /**
   * Check if appointment is today
   * 
   * @returns Whether appointment is today
   */
  isToday(): boolean {
    // Rely on datetime utility
    return false; // This is a placeholder, will be replaced by datetime.isToday() in service
  }

  /**
   * Get appointment end time
   * 
   * @returns End time as Date
   */
  getEndTime(): Date {
    const endTime = new Date(this.appointmentDate);
    if (this.duration) {
      endTime.setMinutes(endTime.getMinutes() + this.duration);
    } else {
      // Default to 1 hour if no duration specified
      endTime.setHours(endTime.getHours() + 1);
    }
    return endTime;
  }

  /**
   * Update appointment properties
   * 
   * @param data - Appointment data to update
   */
  update(data: Partial<Appointment>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.customerId !== undefined) this.customerId = data.customerId;
    if (data.projectId !== undefined) this.projectId = data.projectId;
    if (data.appointmentDate !== undefined) this.appointmentDate = data.appointmentDate;
    if (data.duration !== undefined) this.duration = data.duration;
    if (data.location !== undefined) this.location = data.location;
    if (data.description !== undefined) this.description = data.description;
    if (data.status !== undefined) this.status = data.status;
    
    // Always update the updatedAt timestamp
    this.updatedAt = new Date();
  }

  /**
   * Change appointment status
   * 
   * @param status - New status
   */
  changeStatus(status: AppointmentStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  /**
   * Get status label for displaying
   * 
   * @returns Formatted status label
   */
  getStatusLabel(): string {
    switch (this.status) {
      case AppointmentStatus.PLANNED:
        return 'Planned';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmed';
      case AppointmentStatus.COMPLETED:
        return 'Completed';
      case AppointmentStatus.CANCELED:
        return 'Canceled';
      default:
        return this.status;
    }
  }

  /**
   * Get CSS class for status display
   * 
   * @returns CSS class name
   */
  getStatusClass(): string {
    switch (this.status) {
      case AppointmentStatus.PLANNED:
        return 'status-planned';
      case AppointmentStatus.CONFIRMED:
        return 'status-confirmed';
      case AppointmentStatus.COMPLETED:
        return 'status-completed';
      case AppointmentStatus.CANCELED:
        return 'status-canceled';
      default:
        return 'status-default';
    }
  }
}

/**
 * Appointment status enum
 * Aligned with Prisma schema
 */
export enum AppointmentStatus {
  PLANNED = "planned",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELED = "canceled"
}
