/**
 * ContactRequest entity model
 * Represents a contact request submitted by a customer
 */
export class ContactRequest {
  /**
   * Unique identifier for the contact request
   */
  id: number;

  /**
   * Name of the person submitting the request
   */
  name: string;

  /**
   * Email address of the person submitting the request
   */
  email: string;

  /**
   * Optional phone number of the person submitting the request
   */
  phone?: string;

  /**
   * Type of service requested
   */
  service: string;

  /**
   * The request message/content
   */
  message: string;

  /**
   * Current status of the request
   * Possible values: neu, in_bearbeitung, beantwortet, geschlossen
   */
  status: string;

  /**
   * ID of the staff member processing this request (optional)
   */
  processorId?: number;

  /**
   * IP address of the request submitter (for security tracking)
   */
  ipAddress?: string;

  /**
   * Timestamp when the request was created
   */
  createdAt: Date;

  /**
   * Timestamp when the request was last updated
   */
  updatedAt: Date;
}

/**
 * Request Note entity
 */
export class RequestNote {
  /**
   * Unique identifier for the note
   */
  id: number;

  /**
   * ID of the request this note belongs to
   */
  requestId: number;

  /**
   * ID of the user who created the note
   */
  userId: number;

  /**
   * Name of the user who created the note (denormalized for performance)
   */
  userName: string;

  /**
   * The note text content
   */
  text: string;

  /**
   * Timestamp when the note was created
   */
  createdAt: Date;
}

/**
 * Request status enum
 */
export enum RequestStatus {
  NEW = 'neu',
  IN_PROGRESS = 'in_bearbeitung',
  ANSWERED = 'beantwortet',
  CLOSED = 'geschlossen'
}
