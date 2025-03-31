/**
 * Project entity
 * 
 * Domain entity representing a project in the system.
 * Aligned with the Prisma schema.
 */
export class Project {
  /**
   * Project ID
   */
  id: number;
  
  /**
   * Project title
   */
  title: string;
  
  /**
   * Customer ID (optional)
   */
  customerId?: number;
  
  /**
   * Service ID (optional)
   */
  serviceId?: number;
  
  /**
   * Project start date
   */
  startDate?: Date;
  
  /**
   * Project end date
   */
  endDate?: Date;
  
  /**
   * Project amount/budget
   */
  amount?: number;
  
  /**
   * Project description
   */
  description?: string;
  
  /**
   * Project status
   */
  status: ProjectStatus;
  
  /**
   * ID of user who created this project
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
   * Project notes (populated by relation)
   */
  notes?: any[];
  
  /**
   * Project appointments (populated by relation)
   */
  appointments?: any[];

  /**
   * Creates a new Project instance
   * 
   * @param data - Project data
   */
  constructor(data: Partial<Project> = {}) {
    this.id = data.id || 0;
    this.title = data.title || '';
    this.customerId = data.customerId;
    this.serviceId = data.serviceId;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.amount = data.amount;
    this.description = data.description;
    this.status = data.status || ProjectStatus.NEW;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.notes = data.notes || [];
    this.appointments = data.appointments || [];
  }

  /**
   * Get formatted start date (YYYY-MM-DD)
   * 
   * @returns Formatted date or empty string
   */
  getFormattedStartDate(): string {
    return this.startDate ? this.startDate.toISOString().split('T')[0] : '';
  }

  /**
   * Get formatted end date (YYYY-MM-DD)
   * 
   * @returns Formatted date or empty string
   */
  getFormattedEndDate(): string {
    return this.endDate ? this.endDate.toISOString().split('T')[0] : '';
  }

  /**
   * Get project duration in days
   * 
   * @returns Duration in days or null if dates are incomplete
   */
  getDurationDays(): number | null {
    if (!this.startDate || !this.endDate) {
      return null;
    }
    
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Check if project is active
   * 
   * @returns Whether project is in progress
   */
  isActive(): boolean {
    return this.status === ProjectStatus.IN_PROGRESS;
  }

  /**
   * Check if project is completed
   * 
   * @returns Whether project is completed
   */
  isCompleted(): boolean {
    return this.status === ProjectStatus.COMPLETED;
  }

  /**
   * Update project properties
   * 
   * @param data - Project data to update
   */
  update(data: Partial<Project>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.customerId !== undefined) this.customerId = data.customerId;
    if (data.serviceId !== undefined) this.serviceId = data.serviceId;
    if (data.startDate !== undefined) this.startDate = data.startDate;
    if (data.endDate !== undefined) this.endDate = data.endDate;
    if (data.amount !== undefined) this.amount = data.amount;
    if (data.description !== undefined) this.description = data.description;
    if (data.status !== undefined) this.status = data.status;
    
    // Always update the updatedAt timestamp
    this.updatedAt = new Date();
  }

  /**
   * Change project status
   * 
   * @param status - New status
   */
  changeStatus(status: ProjectStatus): void {
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
      case ProjectStatus.NEW:
        return 'Neu';
      case ProjectStatus.IN_PROGRESS:
        return 'In Bearbeitung';
      case ProjectStatus.COMPLETED:
        return 'Abgeschlossen';
      case ProjectStatus.CANCELED:
        return 'Storniert';
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
      case ProjectStatus.NEW:
        return 'status-new';
      case ProjectStatus.IN_PROGRESS:
        return 'status-in-progress';
      case ProjectStatus.COMPLETED:
        return 'status-completed';
      case ProjectStatus.CANCELED:
        return 'status-canceled';
      default:
        return 'status-default';
    }
  }
}

/**
 * Project status enum
 * Aligned with Prisma schema
 */
export enum ProjectStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELED = "canceled"
}
