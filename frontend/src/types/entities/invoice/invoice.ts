/**
 * Invoice entity interface
 * 
 * Domain entity representing an invoice in the system.
 * Aligned with the Prisma schema.
 */
export interface IInvoice {
  /**
   * Invoice ID
   */
  id: number;
  
  /**
   * Invoice number
   */
  invoiceNumber: string;
  
  /**
   * Project ID
   */
  projectId?: number;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Amount without VAT
   */
  amount: number;
  
  /**
   * VAT amount
   */
  vatAmount: number;
  
  /**
   * Total amount with VAT
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
   * Payment date
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
}

/**
 * Invoice item entity interface
 * 
 * Domain entity representing an invoice item in the system.
 * Aligned with the Prisma schema.
 */
export interface IInvoiceItem {
  /**
   * Invoice item ID
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
}

/**
 * Invoice status enum
 * Aligned with Prisma schema
 */
export enum InvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PAID = "paid",
  CANCELLED = "cancelled",
  OVERDUE = "overdue"
}
