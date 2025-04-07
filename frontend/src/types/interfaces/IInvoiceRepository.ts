import { Invoice, InvoiceItem } from '../entities/Invoice.js';
import { IBaseRepository } from './IBaseRepository.js';
import { InvoiceFilterParams } from '../dtos/InvoiceDtos.js';

/**
 * Interface for invoice repository
 * Extends the base repository with invoice-specific methods
 */
export interface IInvoiceRepository extends IBaseRepository<Invoice, number> {
  /**
   * Find invoices by filter parameters
   * 
   * @param filters - Filter parameters
   * @returns Promise with invoices and pagination info
   */
  findInvoices(filters: InvoiceFilterParams): Promise<{ data: Invoice[]; pagination: any }>;
  
  /**
   * Find invoices for a customer
   * 
   * @param customerId - Customer ID
   * @returns Promise with invoices
   */
  findByCustomer(customerId: number): Promise<Invoice[]>;
  
  /**
   * Find invoices for a project
   * 
   * @param projectId - Project ID
   * @returns Promise with invoices
   */
  findByProject(projectId: number): Promise<Invoice[]>;
  
  /**
   * Get invoice with detailed relations
   * 
   * @param id - Invoice ID
   * @returns Promise with invoice including all related data
   */
  findByIdWithDetails(id: number): Promise<Invoice | null>;
  
  /**
   * Create invoice with items
   * 
   * @param invoice - Invoice data
   * @param items - Invoice items
   * @returns Promise with created invoice
   */
  createWithItems(invoice: Partial<Invoice>, items: Partial<InvoiceItem>[]): Promise<Invoice>;
  
  /**
   * Update invoice items
   * 
   * @param invoiceId - Invoice ID
   * @param items - Invoice items
   * @returns Promise with updated items
   */
  updateItems(invoiceId: number, items: Partial<InvoiceItem>[]): Promise<InvoiceItem[]>;
  
  /**
   * Get invoice items
   * 
   * @param invoiceId - Invoice ID
   * @returns Promise with invoice items
   */
  getItems(invoiceId: number): Promise<InvoiceItem[]>;
  
  /**
   * Generate invoice number
   * 
   * @returns Promise with generated invoice number
   */
  generateInvoiceNumber(): Promise<string>;
  
  /**
   * Mark invoice as paid
   * 
   * @param id - Invoice ID
   * @param paidAt - Payment date
   * @returns Promise with updated invoice
   */
  markAsPaid(id: number, paidAt: Date): Promise<Invoice>;
  
  /**
   * Batch update invoice status
   * 
   * @param ids - Invoice IDs
   * @param status - New status
   * @returns Promise with number of updated invoices
   */
  batchUpdateStatus(ids: number[], status: string): Promise<number>;
  
  /**
   * Get invoice statistics
   * 
   * @param filters - Optional filter parameters
   * @returns Promise with statistics
   */
  getStatistics(filters?: Partial<InvoiceFilterParams>): Promise<any>;
}
