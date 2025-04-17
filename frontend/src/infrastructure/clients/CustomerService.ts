/**
 * Client for customer service API
 */
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { 
  CustomerResponseDto, 
  CustomerFilterParamsDto, 
  CreateCustomerDto, 
  UpdateCustomerDto 
} from '@/domain/dtos/CustomerDtos';

interface StatsResponse {
  period: string;
  customers: number;
}

export class CustomerService {
  private static readonly basePath = "/customers";

  /**
   * Get all customers with optional filtering
   */
  static async getCustomers(filters?: CustomerFilterParamsDto) {
    try {
      let queryParams = '';
      if (filters) {
        // Create a clean params object without undefined/null values
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== undefined && value !== null && value !== ''
          )
        );
        
        queryParams = '?' + new URLSearchParams(cleanFilters as any).toString();
      }
      
      return await ApiClient.get(`${this.basePath}${queryParams}`);
    } catch (error) {
      console.error('Error in CustomerService.getCustomers:', error);
      return {
        success: false,
        data: { 
          data: [], 
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: 0,
            totalPages: 0
          }
        },
        message: error instanceof Error ? error.message : 'Error fetching customers'
      };
    }
  }

  /**
   * Get a specific customer by ID
   */
  static async getCustomerById(id: number) {
    return ApiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Create a new customer
   */
  static async createCustomer(data: CreateCustomerDto) {
    return ApiClient.post(this.basePath, data);
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: number, data: UpdateCustomerDto) {
    return ApiClient.put(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(id: number) {
    return ApiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get customer count
   */
  static async count() {
    return ApiClient.get(`${this.basePath}/count`);
  }
  
  /**
   * Get monthly customer statistics
   */
  static async getMonthlyStats() {
    return ApiClient.get(`${this.basePath}/stats/monthly`);
  }
  
  /**
   * Get weekly customer statistics
   */
  static async getWeeklyStats() {
    return ApiClient.get(`${this.basePath}/stats/weekly`);
  }
  
  /**
   * Get yearly customer statistics
   */
  static async getYearlyStats() {
    return ApiClient.get(`${this.basePath}/stats/yearly`);
  }

  /**
   * Add a note to a customer
   */
  static async addCustomerNote(id: number, note: string) {
    try {
      console.log(`Adding note to customer ${id}:`, note);
      const response = await ApiClient.post(`${this.basePath}/${id}/notes`, { note });
      console.log('Add note response:', response);
      return response;
    } catch (error) {
      console.error('Error in CustomerService.addCustomerNote:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error adding customer note'
      };
    }
  }

  /**
   * Get notes for a customer
   */
  static async getCustomerNotes(id: number, forceFresh = false) {
    try {
      // Add cache busting parameter if needed
      const cacheBuster = forceFresh ? `?_t=${Date.now()}` : '';
      console.log(`Fetching notes for customer ${id}${forceFresh ? ' with cache busting' : ''}`);
      const response = await ApiClient.get(`${this.basePath}/${id}/notes${cacheBuster}`);
      console.log('Get notes response:', response);
      return response;
    } catch (error) {
      console.error('Error in CustomerService.getCustomerNotes:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Error fetching customer notes'
      };
    }
  }
}
