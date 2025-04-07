/**
 * Service entity interface
 * 
 * Domain entity representing a service in the system.
 * Aligned with the Prisma schema.
 */
export interface IService {
  /**
   * Service ID
   */
  id: number;
  
  /**
   * Service name
   */
  name: string;
  
  /**
   * Description
   */
  description?: string;
  
  /**
   * Base price
   */
  basePrice: number;
  
  /**
   * VAT rate (percentage)
   */
  vatRate: number;
  
  /**
   * Whether the service is active
   */
  active: boolean;
  
  /**
   * Unit (e.g., "hour", "session", "package")
   */
  unit?: string;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
}
