/**
 * Customer entity
 * 
 * Domain entity representing a customer in the system.
 */
export class Customer {
    /**
     * Customer ID
     */
    id: number;
    
    /**
     * Customer name
     */
    name: string;
    
    /**
     * Company name (for business customers)
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
     * Street address
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
     * Customer status
     */
    status: CustomerStatus;
    
    /**
     * Customer type (private or business)
     */
    type: CustomerType;
    
    /**
     * Newsletter subscription status
     */
    newsletter: boolean;
    
    /**
     * Customer notes
     */
    notes?: string;
    
    /**
     * Creation timestamp
     */
    createdAt: Date;
    
    /**
     * Last update timestamp
     */
    updatedAt: Date;
    
    /**
     * ID of the user who created this customer
     */
    createdBy?: number;
    
    /**
     * ID of the user who last updated this customer
     */
    updatedBy?: number;
    
    /**
     * Related projects
     */
    projects?: any[];
    
    /**
     * Related appointments
     */
    appointments?: any[];
    
    logs?: any[];
  
    /**
     * Creates a new Customer instance
     * 
     * @param data - Customer data
     */
    constructor(data: Partial<Customer> = {}) {
      this.id = data.id || 0;
      this.name = data.name || '';
      this.company = data.company;
      this.email = data.email;
      this.phone = data.phone;
      this.address = data.address;
      this.postalCode = data.postalCode;
      this.city = data.city;
      this.country = data.country || 'Deutschland';
      this.status = data.status || CustomerStatus.ACTIVE;
      this.type = data.type || CustomerType.PRIVATE;
      this.newsletter = data.newsletter || false;
      this.notes = data.notes;
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
      this.createdBy = data.createdBy;
      this.updatedBy = data.updatedBy;
      this.projects = data.projects || [];
      this.appointments = data.appointments || [];
    }
  
    /**
     * Check if customer is active
     * 
     * @returns Whether customer is active
     */
    isActive(): boolean {
      return this.status === CustomerStatus.ACTIVE;
    }
  
    /**
     * Update customer properties
     * 
     * @param data - Customer data to update
     */
    update(data: Partial<Customer>): void {
      // Update only defined properties
      if (data.name !== undefined) this.name = data.name;
      if (data.company !== undefined) this.company = data.company;
      if (data.email !== undefined) this.email = data.email;
      if (data.phone !== undefined) this.phone = data.phone;
      if (data.address !== undefined) this.address = data.address;
      if (data.postalCode !== undefined) this.postalCode = data.postalCode;
      if (data.city !== undefined) this.city = data.city;
      if (data.country !== undefined) this.country = data.country;
      if (data.status !== undefined) this.status = data.status;
      if (data.type !== undefined) this.type = data.type;
      if (data.newsletter !== undefined) this.newsletter = data.newsletter;
      if (data.notes !== undefined) this.notes = data.notes;
      
      // Always update the updatedAt timestamp
      this.updatedAt = new Date();
    }
  
    /**
     * Add a note to the customer
     * 
     * @param note - Note to add
     */
    addNote(note: string): void {
      if (!this.notes) {
        this.notes = note;
      } else {
        this.notes += '\n\n' + note;
      }
      
      this.updatedAt = new Date();
    }
  
    /**
     * Get full address as formatted string
     * 
     * @returns Formatted address
     */
    getFullAddress(): string {
      const parts = [];
      
      if (this.address) parts.push(this.address);
      if (this.postalCode || this.city) {
        const cityLine = [this.postalCode, this.city].filter(Boolean).join(' ');
        parts.push(cityLine);
      }
      if (this.country) parts.push(this.country);
      
      return parts.join(', ');
    }
  }
  
  /**
   * Customer status enum
   */
  export enum CustomerStatus {
    ACTIVE = 'aktiv',
    INACTIVE = 'inaktiv',
    ON_HOLD = 'pausiert',
    DELETED = 'geloescht'
  }
  
  /**
   * Customer type enum
   */
  export enum CustomerType {
    PRIVATE = 'privat',
    BUSINESS = 'geschaeft'
  }