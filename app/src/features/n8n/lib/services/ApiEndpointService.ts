import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors';

/**
 * Service for managing API endpoints exposed to N8N
 */
export class ApiEndpointService {
  constructor(
    protected apiEndpointRepository, // Will be implemented later
    protected logger: ILoggingService,
    protected errorHandler: IErrorHandler
  ) {}
  
  /**
   * Get all registered API endpoints
   * 
   * @returns List of API endpoints
   */
  async getApiEndpoints() {
    try {
      return await this.apiEndpointRepository.findAll();
    } catch (error) {
      this.logger.error('Error fetching API endpoints', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Register a new API endpoint
   * 
   * @param endpoint - API endpoint configuration
   * @returns Created API endpoint
   */
  async registerApiEndpoint(endpoint) {
    try {
      // Validate endpoint data
      this.validateEndpoint(endpoint);
      
      return await this.apiEndpointRepository.create(endpoint);
    } catch (error) {
      this.logger.error('Error registering API endpoint', {
        error: error instanceof Error ? error.message : String(error),
        endpoint
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Update an existing API endpoint
   * 
   * @param id - API endpoint ID
   * @param endpoint - Updated API endpoint data
   * @returns Updated API endpoint
   */
  async updateApiEndpoint(id, endpoint) {
    try {
      // Validate endpoint data
      this.validateEndpoint(endpoint);
      
      return await this.apiEndpointRepository.update(id, endpoint);
    } catch (error) {
      this.logger.error('Error updating API endpoint', {
        error: error instanceof Error ? error.message : String(error),
        id,
        endpoint
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Delete an API endpoint
   * 
   * @param id - API endpoint ID
   * @returns Operation result
   */
  async deleteApiEndpoint(id) {
    try {
      await this.apiEndpointRepository.delete(id);
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting API endpoint', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Get API endpoint by path and method
   * 
   * @param path - API path
   * @param method - HTTP method
   * @returns API endpoint or null if not found
   */
  async getApiEndpointByPathAndMethod(path: string, method: string) {
    try {
      return await this.apiEndpointRepository.findOne({
        where: { path, method }
      });
    } catch (error) {
      this.logger.error('Error fetching API endpoint by path and method', {
        error: error instanceof Error ? error.message : String(error),
        path,
        method
      });
      throw this.handleError(error);
    }
  }
  
  /**
   * Automatically discover API endpoints from route files
   * 
   * @returns List of discovered endpoints
   */
  async discoverApiEndpoints() {
    // This method would scan the API route files and extract endpoints
    // Implementation would depend on your routing system
    // For now, return an empty array as a placeholder
    return [];
  }
  
  /**
   * Validate API endpoint data
   * 
   * @param endpoint - API endpoint to validate
   * @throws Error if validation fails
   */
  private validateEndpoint(endpoint: any) {
    if (!endpoint.path) {
      throw new Error('API endpoint path is required');
    }
    
    if (!endpoint.method) {
      throw new Error('API endpoint method is required');
    }
    
    // Add more validation as needed
  }
  
  /**
   * Standardize error handling
   * 
   * @param error - Error to handle
   * @returns Standardized error
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}