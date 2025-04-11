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

export class CustomerService {
  private static readonly basePath = "/customers";

  /**
   * Get all customers with optional filtering
   */
  static async getCustomers(filters?: CustomerFilterParamsDto) {
    let queryParams = '';
    if (filters) {
      queryParams = '?' + new URLSearchParams(filters as any).toString();
    }
    return ApiClient.get(`${this.basePath}${queryParams}`);
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
}
