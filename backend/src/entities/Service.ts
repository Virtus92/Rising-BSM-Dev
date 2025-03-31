/**
 * Service entity
 * 
 * Domain entity representing a service in the system.
 * Aligned with the Prisma schema.
 */
export class Service {
  /**
   * Service ID
   */
  id: number;
  
  /**
   * Service name
   */
  name: string;
  
  /**
   * Service description
   */
  description?: string;
  
  /**
   * Base price
   */
  basePrice: number;
  
  /**
   * VAT rate in percent
   */
  vatRate: number;
  
  /**
   * Activity status
   */
  active: boolean;
  
  /**
   * Unit (e.g., hour, piece, etc.)
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

  /**
   * Creates a new Service instance
   * 
   * @param data - Service data
   */
  constructor(data: Partial<Service> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.description = data.description;
    this.basePrice = data.basePrice || 0;
    this.vatRate = data.vatRate || 20; // Default VAT rate in Austria is 20%
    this.active = data.active !== undefined ? data.active : true;
    this.unit = data.unit;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Calculate price with VAT
   * 
   * @returns Price including VAT
   */
  getPriceWithVat(): number {
    return this.basePrice * (1 + this.vatRate / 100);
  }

  /**
   * Calculate VAT amount
   * 
   * @returns VAT amount
   */
  getVatAmount(): number {
    return this.basePrice * (this.vatRate / 100);
  }

  /**
   * Get formatted base price
   * 
   * @param locale - Locale to use for formatting
   * @returns Formatted price
   */
  getFormattedBasePrice(locale: string = 'de-AT'): string {
    return this.basePrice.toLocaleString(locale, {
      style: 'currency',
      currency: 'EUR'
    });
  }

  /**
   * Get formatted price with VAT
   * 
   * @param locale - Locale to use for formatting
   * @returns Formatted price
   */
  getFormattedPriceWithVat(locale: string = 'de-AT'): string {
    return this.getPriceWithVat().toLocaleString(locale, {
      style: 'currency',
      currency: 'EUR'
    });
  }

  /**
   * Get formatted price string with unit
   * 
   * @returns Formatted price with unit
   */
  getPriceWithUnit(): string {
    const formattedPrice = this.getFormattedBasePrice();
    return this.unit ? `${formattedPrice} / ${this.unit}` : formattedPrice;
  }

  /**
   * Check if service is active
   * 
   * @returns Whether service is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Activate service
   */
  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate service
   */
  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  /**
   * Update service properties
   * 
   * @param data - Service data to update
   */
  update(data: Partial<Service>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.basePrice !== undefined) this.basePrice = data.basePrice;
    if (data.vatRate !== undefined) this.vatRate = data.vatRate;
    if (data.active !== undefined) this.active = data.active;
    if (data.unit !== undefined) this.unit = data.unit;
    
    // Always update the updatedAt timestamp
    this.updatedAt = new Date();
  }

  /**
   * Get activity status label
   * 
   * @returns Status label
   */
  getStatusLabel(): string {
    return this.active ? 'Aktiv' : 'Inaktiv';
  }
}
