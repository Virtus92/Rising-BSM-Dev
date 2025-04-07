/**
 * Customer entity interface
 * 
 * Domain entity representing a customer in the system.
 * Aligned with the Prisma schema.
 */
export interface ICustomer {
  /**
   * Customer ID
   */
  id: number;
  
  /**
   * Customer name
   */
  name: string;
  
  /**
   * Company name (optional for business customers)
   */
  company?: string;
  
  /**
   * Email address
   */
  email?: string;
  
  /**
   * Phone number
   */
  phone?: string;
  
  /**
   * Address
   */
  address?: string;
  
  /**
   * Postal code
   */
  postalCode?: string;
  
  /**
   * City
   */
  city?: string;
  
  /**
   * Country
   */
  country: string;
  
  /**
   * Additional notes
   */
  notes?: string;
  
  /**
   * Whether customer has subscribed to newsletter
   */
  newsletter: boolean;
  
  /**
   * Customer status
   */
  status: CustomerStatus;
  
  /**
   * Customer type
   */
  type: CustomerType;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
  
  /**
   * ID of user who created this customer
   */
  createdBy?: number;
  
  /**
   * ID of user who last updated this customer
   */
  updatedBy?: number;
}

/**
 * Customer status enum
 * Aligned with Prisma schema
 */
export enum CustomerStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DELETED = "deleted"
}

/**
 * Customer type enum
 * Aligned with Prisma schema
 */
export enum CustomerType {
  PRIVATE = "private",
  BUSINESS = "business"
}
