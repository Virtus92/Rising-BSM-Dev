/**
 * Contact request entity interface
 * 
 * Domain entity representing a contact request in the system.
 * Aligned with the Prisma schema.
 */
export interface IContactRequest {
  /**
   * Contact request ID
   */
  id: number;
  
  /**
   * Name of the person making the request
   */
  name: string;
  
  /**
   * Email address
   */
  email: string;
  
  /**
   * Phone number
   */
  phone?: string;
  
  /**
   * Requested service
   */
  service: string;
  
  /**
   * Message
   */
  message: string;
  
  /**
   * Request status
   */
  status: ContactRequestStatus;
  
  /**
   * ID of user processing the request
   */
  processorId?: number;
  
  /**
   * IP address of the requester
   */
  ipAddress?: string;
  
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
 * Request note entity interface
 * 
 * Domain entity representing a note on a contact request.
 * Aligned with the Prisma schema.
 */
export interface IRequestNote {
  /**
   * Note ID
   */
  id: number;
  
  /**
   * Contact request ID
   */
  requestId: number;
  
  /**
   * User ID
   */
  userId: number;
  
  /**
   * User name
   */
  userName: string;
  
  /**
   * Note text
   */
  text: string;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
}

/**
 * Contact request status enum
 * Aligned with Prisma schema
 */
export enum ContactRequestStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SPAM = "spam"
}
