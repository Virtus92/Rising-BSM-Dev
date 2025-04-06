/**
 * Invoice entity
 * 
 * Domain entity representing an invoice in the system.
 * Aligned with the Prisma schema.
 */
export class Invoice {
  /**
   * Invoice ID
   */
  id: number;
  
  /**
   * Invoice number
   */
  invoiceNumber: string;
  
  /**
   * Project ID (optional)
   */
  projectId?: number;
  
  /**
   * Customer ID (optional)
   */
  customerId?: number;
  
  /**
   * Net amount
   */
  amount: number;
  
  /**
   * VAT amount
   */
  vatAmount: number;
  
  /**
   * Total amount (including VAT)
   */
  totalAmount: number;
  
  /**
   * Invoice date
   */
  invoiceDate: Date;
  
  /**
   * Due date
   */
  dueDate: Date;
  
  /**
   * Payment date (if paid)
   */
  paidAt?: Date;
  
  /**
   * Invoice status
   */
  status: InvoiceStatus;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
  
  /**
   * Invoice items/positions (populated by relation)
   */
  items?: InvoiceItem[];

  /**
   * Creates a new Invoice instance
   * 
   * @param data - Invoice data
   */
  constructor(data: Partial<Invoice> = {}) {
    this.id = data.id || 0;
    this.invoiceNumber = data.invoiceNumber || '';
    this.projectId = data.projectId;
    this.customerId = data.customerId;
    this.amount = data.amount || 0;
    this.vatAmount = data.vatAmount || 0;
    this.totalAmount = data.totalAmount || 0;
    this.invoiceDate = data.invoiceDate || new Date();
    this.dueDate = data.dueDate || new Date();
    this.paidAt = data.paidAt;
    this.status = data.status || InvoiceStatus.OPEN;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.items = data.items || [];
  }

  /**
   * Get formatted invoice date (YYYY-MM-DD)
   * 
   * @returns Formatted date
   */
  getFormattedInvoiceDate(): string {
    return this.invoiceDate.toISOString().split('T')[0];
  }

  /**
   * Get formatted due date (YYYY-MM-DD)
   * 
   * @returns Formatted date
   */
  getFormattedDueDate(): string {
    return this.dueDate.toISOString().split('T')[0];
  }

  /**
   * Get formatted paid date (YYYY-MM-DD)
   * 
   * @returns Formatted date or empty string if not paid
   */
  getFormattedPaidDate(): string {
    return this.paidAt ? this.paidAt.toISOString().split('T')[0] : '';
  }

  /**
   * Get formatted amount
   * 
   * @param locale - Locale to use for formatting
   * @returns Formatted amount
   */
  getFormattedAmount(locale: string = 'de-AT'): string {
    return this.amount.toLocaleString(locale, {
      style: 'currency',
      currency: 'EUR'
    });
  }

  /**
   * Get formatted VAT amount
   * 
   * @param locale - Locale to use for formatting
   * @returns Formatted VAT amount
   */
  getFormattedVatAmount(locale: string = 'de-AT'): string {
    return this.vatAmount.toLocaleString(locale, {
      style: 'currency',
      currency: 'EUR'
    });
  }

  /**
   * Get formatted total amount
   * 
   * @param locale - Locale to use for formatting
   * @returns Formatted total amount
   */
  getFormattedTotalAmount(locale: string = 'de-AT'): string {
    return this.totalAmount.toLocaleString(locale, {
      style: 'currency',
      currency: 'EUR'
    });
  }

  /**
   * Check if invoice is overdue
   * 
   * @returns Whether invoice is overdue
   */
  isOverdue(): boolean {
    if (this.status === InvoiceStatus.PAID || this.status === InvoiceStatus.CANCELED) {
      return false;
    }
    
    const today = new Date();
    return this.dueDate < today;
  }

  /**
   * Get days until due (negative if overdue)
   * 
   * @returns Days until due
   */
  getDaysUntilDue(): number {
    const today = new Date();
    const diffTime = this.dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Mark invoice as paid
   * 
   * @param paidAt - Payment date (defaults to current date)
   */
  markAsPaid(paidAt: Date = new Date()): void {
    this.paidAt = paidAt;
    this.status = InvoiceStatus.PAID;
    this.updatedAt = new Date();
  }

  /**
   * Mark invoice as partially paid
   */
  markAsPartiallyPaid(): void {
    this.status = InvoiceStatus.PARTIALLY_PAID;
    this.updatedAt = new Date();
  }

  /**
   * Cancel invoice
   */
  cancel(): void {
    this.status = InvoiceStatus.CANCELED;
    this.updatedAt = new Date();
  }

  /**
   * Update invoice properties
   * 
   * @param data - Invoice data to update
   */
  update(data: Partial<Invoice>): void {
    if (data.invoiceNumber !== undefined) this.invoiceNumber = data.invoiceNumber;
    if (data.projectId !== undefined) this.projectId = data.projectId;
    if (data.customerId !== undefined) this.customerId = data.customerId;
    if (data.amount !== undefined) this.amount = data.amount;
    if (data.vatAmount !== undefined) this.vatAmount = data.vatAmount;
    if (data.totalAmount !== undefined) this.totalAmount = data.totalAmount;
    if (data.invoiceDate !== undefined) this.invoiceDate = data.invoiceDate;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.paidAt !== undefined) this.paidAt = data.paidAt;
    if (data.status !== undefined) this.status = data.status;
    
    // Always update the updatedAt timestamp
    this.updatedAt = new Date();
  }

  /**
   * Calculate/update invoice totals based on items
   */
  calculateTotals(): void {
    if (!this.items || this.items.length === 0) {
      this.amount = 0;
      this.vatAmount = 0;
      this.totalAmount = 0;
      return;
    }
    
    let amount = 0;
    let vatAmount = 0;
    
    for (const item of this.items) {
      const itemTotal = item.quantity * item.unitPrice;
      amount += itemTotal;
      // Assuming VAT is calculated at invoice level, not per item
    }
    
    this.amount = amount;
    this.vatAmount = 0.2 * amount; // Default 20% VAT
    this.totalAmount = amount + this.vatAmount;
  }

  /**
   * Get status label for displaying
   * 
   * @returns Formatted status label
   */
  getStatusLabel(): string {
    switch (this.status) {
      case InvoiceStatus.OPEN:
        return 'Offen';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'Teilweise bezahlt';
      case InvoiceStatus.PAID:
        return 'Bezahlt';
      case InvoiceStatus.CANCELED:
        return 'Storniert';
      case InvoiceStatus.OVERDUE:
        return 'Überfällig';
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
      case InvoiceStatus.OPEN:
        return 'status-open';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'status-partially-paid';
      case InvoiceStatus.PAID:
        return 'status-paid';
      case InvoiceStatus.CANCELED:
        return 'status-canceled';
      case InvoiceStatus.OVERDUE:
        return 'status-overdue';
      default:
        return 'status-default';
    }
  }
}

/**
 * Invoice status enum
 * Aligned with Prisma schema
 */
export enum InvoiceStatus {
  OPEN = "open",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  CANCELED = "canceled",
  OVERDUE = "overdue"
}

/**
 * Invoice item entity
 */
export class InvoiceItem {
  /**
   * Item ID
   */
  id: number;
  
  /**
   * Invoice ID
   */
  invoiceId: number;
  
  /**
   * Service ID
   */
  serviceId: number;
  
  /**
   * Quantity
   */
  quantity: number;
  
  /**
   * Unit price
   */
  unitPrice: number;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
  
  /**
   * Service name (populated by relation)
   */
  serviceName?: string;

  /**
   * Creates a new InvoiceItem instance
   * 
   * @param data - InvoiceItem data
   */
  constructor(data: Partial<InvoiceItem> = {}) {
    this.id = data.id || 0;
    this.invoiceId = data.invoiceId || 0;
    this.serviceId = data.serviceId || 0;
    this.quantity = data.quantity || 1;
    this.unitPrice = data.unitPrice || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.serviceName = data.serviceName;
  }

  /**
   * Calculate item total
   * 
   * @returns Total price for item
   */
  getTotal(): number {
    return this.quantity * this.unitPrice;
  }

  /**
   * Get formatted unit price
   * 
   * @param locale - Locale to use for formatting
   * @returns Formatted unit price
   */
  getFormattedUnitPrice(locale: string = 'de-AT'): string {
    return this.unitPrice.toLocaleString(locale, {
      style: 'currency',
      currency: 'EUR'
    });
  }

  /**
   * Get formatted total
   * 
   * @param locale - Locale to use for formatting
   * @returns Formatted total
   */
  getFormattedTotal(locale: string = 'de-AT'): string {
    return this.getTotal().toLocaleString(locale, {
      style: 'currency',
      currency: 'EUR'
    });
  }
}
