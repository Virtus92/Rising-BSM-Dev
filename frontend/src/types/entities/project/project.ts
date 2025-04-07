/**
 * Project entity interface
 * 
 * Domain entity representing a project in the system.
 * Aligned with the Prisma schema.
 */
export interface IProject {
  /**
   * Project ID
   */
  id: number;
  
  /**
   * Project title
   */
  title: string;
  
  /**
   * Customer ID (owner of the project)
   */
  customerId?: number;
  
  /**
   * Service ID (related service)
   */
  serviceId?: number;
  
  /**
   * Start date
   */
  startDate?: Date;
  
  /**
   * End date
   */
  endDate?: Date;
  
  /**
   * Project amount/budget
   */
  amount?: number;
  
  /**
   * Description
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
}

/**
 * Project status enum
 * Aligned with Prisma schema
 */
export enum ProjectStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}
