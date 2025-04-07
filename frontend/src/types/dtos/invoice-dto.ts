import { InvoiceStatus } from '../entities/Invoice.js';

/**
 * DTO for creating an invoice
 */
export interface InvoiceCreateDto {
  /**
   * Invoice number (optional, auto-generated if not provided)
   */
  invoiceNumber?: string;
  
  /**
   * Project ID (optional)
   */
  projectId?: number;
  
  /**
   * Customer ID (optional)
   */
  customerId?: number;
  
  /**
   * Invoice date (YYYY-MM-DD)
   */
  invoiceDate: string;
  
  /**
   * Due date (YYYY-MM-DD)
   */
  dueDate: string;
  
  /**
   * Invoice status
   */
  status?: InvoiceStatus;
  
  /**
   * Invoice positions/items
   */
  items: InvoiceItemDto[];
}

/**
 * DTO for invoice item
 */
export interface InvoiceItemDto {
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
}

/**
 * DTO for updating an invoice
 */
export interface InvoiceUpdateDto {
  /**
   * Invoice number
   */
  invoiceNumber?: string;
  
  /**
   * Project ID
   */
  projectId?: number;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Invoice date (YYYY-MM-DD)
   */
  invoiceDate?: string;
  
  /**
   * Due date (YYYY-MM-DD)
   */
  dueDate?: string;
  
  /**
   * Payment date (YYYY-MM-DD or null)
   */
  paidAt?: string | null;
  
  /**
   * Invoice status
   */
  status?: InvoiceStatus;
}

/**
 * DTO for invoice response
 */
export interface InvoiceResponseDto {
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
   * Project title
   */
  projectTitle?: string;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Customer name
   */
  customerName?: string;
  
  /**
   * Net amount
   */
  amount: number;
  
  /**
   * Formatted net amount
   */
  formattedAmount: string;
  
  /**
   * VAT amount
   */
  vatAmount: number;
  
  /**
   * Formatted VAT amount
   */
  formattedVatAmount: string;
  
  /**
   * Total amount (including VAT)
   */
  totalAmount: number;
  
  /**
   * Formatted total amount
   */
  formattedTotalAmount: string;
  
  /**
   * Invoice date (YYYY-MM-DD)
   */
  invoiceDate: string;
  
  /**
   * Due date (YYYY-MM-DD)
   */
  dueDate: string;
  
  /**
   * Payment date (YYYY-MM-DD or null)
   */
  paidAt?: string;
  
  /**
   * Invoice status
   */
  status: InvoiceStatus;
  
  /**
   * Formatted status label
   */
  statusLabel: string;
  
  /**
   * CSS class for status
   */
  statusClass: string;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
}

/**
 * DTO for detailed invoice response
 */
export interface InvoiceDetailResponseDto extends InvoiceResponseDto {
  /**
   * Customer details
   */
  customer?: {
    id: number;
    name: string;
    company?: string;
    email?: string;
    address?: string;
    postalCode?: string;
    city?: string;
  };
  
  /**
   * Project details
   */
  project?: {
    id: number;
    title: string;
    status: string;
  };
  
  /**
   * Invoice positions/items
   */
  items: {
    id: number;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

/**
 * DTO for invoice status update
 */
export interface InvoiceStatusUpdateDto {
  /**
   * New invoice status
   */
  status: InvoiceStatus;
  
  /**
   * Optional note about the status change
   */
  note?: