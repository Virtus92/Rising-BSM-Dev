/**
 * INotificationEvents
 * 
 * Interface for notification event payloads
 */

/**
 * Base notification event interface
 */
export interface BaseNotificationEvent {
  /**
   * Event timestamp
   */
  timestamp?: Date;
}

/**
 * Contact request created event
 */
export interface ContactRequestCreatedEvent extends BaseNotificationEvent {
  /**
   * ID of the user sending the contact request
   */
  senderId: number;
  
  /**
   * Name of the user sending the contact request
   */
  senderName: string;
  
  /**
   * ID of the user receiving the contact request
   */
  recipientId: number;
  
  /**
   * ID of the contact request
   */
  requestId: number;
}

/**
 * Contact request accepted event
 */
export interface ContactRequestAcceptedEvent extends BaseNotificationEvent {
  /**
   * ID of the user who sent the contact request
   */
  senderId: number;
  
  /**
   * ID of the user who accepted the contact request
   */
  recipientId: number;
  
  /**
   * Name of the user who accepted the contact request
   */
  recipientName: string;
  
  /**
   * ID of the contact request
   */
  requestId: number;
}

/**
 * Contact request rejected event
 */
export interface ContactRequestRejectedEvent extends BaseNotificationEvent {
  /**
   * ID of the user who sent the contact request
   */
  senderId: number;
  
  /**
   * ID of the user who rejected the contact request
   */
  recipientId: number;
  
  /**
   * Name of the user who rejected the contact request (optional)
   */
  recipientName?: string;
  
  /**
   * ID of the contact request
   */
  requestId: number;
  
  /**
   * Reason for rejection (optional)
   */
  reason?: string;
}

/**
 * User status changed event
 */
export interface UserStatusChangedEvent extends BaseNotificationEvent {
  /**
   * ID of the user whose status changed
   */
  userId: number;
  
  /**
   * Previous status
   */
  oldStatus: string;
  
  /**
   * New status
   */
  newStatus: string;
  
  /**
   * Reason for status change (optional)
   */
  reason?: string;
  
  /**
   * ID of the user who changed the status (optional)
   */
  changedById?: number;
}

/**
 * System maintenance event
 */
export interface SystemMaintenanceEvent extends BaseNotificationEvent {
  /**
   * Array of user IDs to notify (empty for all users)
   */
  userIds: number[];
  
  /**
   * Maintenance message
   */
  message: string;
  
  /**
   * Scheduled start time
   */
  startTime?: Date;
  
  /**
   * Estimated end time
   */
  endTime?: Date;
}

/**
 * System update event
 */
export interface SystemUpdateEvent extends BaseNotificationEvent {
  /**
   * Array of user IDs to notify (empty for all users)
   */
  userIds: number[];
  
  /**
   * Update message
   */
  message: string;
  
  /**
   * Update version
   */
  version?: string;
  
  /**
   * Update highlights
   */
  highlights?: string[];
}