import { IBaseService, ServiceOptions, PaginatedResult } from './IBaseService.js';
import { Invoice } from '../entities/Invoice.js';
import { 
  InvoiceCreateDto, 
  InvoiceUpdateDto, 
  InvoiceResponseDto, 
  InvoiceDetailResponseDto,
  InvoiceStatusUpdateDto,
  InvoicePaymentDto,
  InvoiceNoteDto,
  InvoiceFilterParams,
  InvoiceBatchUpdateDto,
  InvoiceStatisticsDto
} from '../dtos/InvoiceDtos.js';

/**
 * Interface for invoice service
 * Extends the base service with invoice-specific methods
 */
export interface IInvoiceService extends IBaseService<Invoice, InvoiceCreateDto, InvoiceUpdateDto, InvoiceResponseDto> {
  /**
   * Get detailed invoice information
   * 
   * @param id - Invoice ID
   * @param options - Service options
   * @returns Promise with detailed invoice response
   */
  getInvoiceDetails(id: number, options?: ServiceOptions): Promise<InvoiceDetailResponseDto | null>;
  
  /**
   * Find invoices with filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with invoices and pagination info
   */
  findInvoices(filters: InvoiceFilterParams): Promise<PaginatedResult<InvoiceResponseDto>>;
  
  /**
   * Find invoices for a customer
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Promise with invoices
   */
  findByCustomer(customerId: number, options?: ServiceOptions): Promise<InvoiceResponseDto[]>;
  
  /**
   * Find invoices for a project
   * 
   * @param projectId - Project ID
   * @param options - Service options
   * @returns Promise with invoices
   */
  findByProject(projectId: number, options?: ServiceOptions): Promise<InvoiceResponseDto[]>;
  
  /**
   * Generate invoice number
   * 
   * @param options - Service options
   * @returns Promise with generated invoice number
   */
  generateInvoiceNumber(options?: ServiceOptions): Promise<string>;
  
  /**
   * Update invoice status
   * 
   * @param id - Invoice ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Promise with updated invoice
   */
  updateStatus(id: number, statusData: InvoiceStatusUpdateDto, options?: ServiceOptions): Promise<InvoiceResponseDto>;
  
  /**
   * Process invoice payment
   * 
   * @param id - Invoice ID
   * @param paymentData - Payment data
   * @param options - Service options
   * @returns Promise with updated invoice
   */
  processPayment(id: number, paymentData: InvoicePaymentDto, options?: ServiceOptions): Promise<InvoiceResponseDto>;
  
  /**
   * Add note to invoice
   * 
   * @param id - Invoice ID
   * @param note - Note text
   * @param options - Service options
   * @returns Promise with created note
   */
  addNote(id: number, note: string, options?: ServiceOptions): Promise<InvoiceNoteDto>;
  
  /**
   * Batch update invoice status
   * 
   * @param data - Batch update data
   * @param options - Service options
   * @returns Promise with update result
   */
  batchUpdateStatus(data: InvoiceBatchUpdateDto, options?: ServiceOptions): Promise<{ success: boolean; count: number }>;
  
  /**
   * Get invoice statistics
   * 
   * @param filters - Optional filter parameters
   * @param options - Service options
   * @returns Promise with statistics
   */
  getInvoiceStatistics(filters?: Partial<InvoiceFilterParams>, options?: ServiceOptions): Promise<InvoiceStatisticsDto>;
  
  /**
   * Export invoices to file
   * 
   * @param format - Export format (csv or excel)
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Promise with export data
   */
  exportData(format: 'csv' | 'excel', filters?: InvoiceFilterParams, options?: ServiceOptions): Promise<{ buffer: Buffer; filename: string }>;
}
