'use client';
/**
 * Client-side Request Data Service Implementation
 */
import { IRequestDataService } from '@/domain/services/IRequestDataService';
import { RequestData } from '@/domain/entities/RequestData';
import { RequestDataHistory } from '@/domain/entities/RequestDataHistory';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { CreateRequestDataDto, UpdateRequestDataDto, RequestDataDto, RequestDataHistoryDto } from '@/domain/dtos/RequestDataDtos';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Client-side RequestDataService implementation
 * This service uses API endpoints for all operations
 */
export class RequestDataService implements IRequestDataService {
  /**
   * Find request data by request ID and optional category
   */
  async findRequestData(requestId: number, category?: string, options?: ServiceOptions): Promise<RequestDataDto[]> {
    try {
      const url = new URL(`/api/requests/${requestId}/data`, window.location.origin);
      if (category) url.searchParams.append('category', category);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error fetching request data for request ${requestId}:`, await response.text());
        return [];
      }
      
      const result = await response.json();
      return Array.isArray(result.data) ? result.data : [result.data].filter(Boolean);
    } catch (error) {
      logger.error(`Error in RequestDataService.findRequestData(${requestId}):`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }
  
  /**
   * Get request data by request ID
   */
  async getByRequestId(requestId: number, options?: ServiceOptions): Promise<RequestDataDto | null> {
    try {
      const response = await fetch(`/api/requests/${requestId}/data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error fetching request data for request ${requestId}:`, await response.text());
        return null;
      }
      
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      logger.error(`Error in RequestDataService.getByRequestId(${requestId}):`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }
  
  /**
   * Create request data
   */
  async createRequestData(data: CreateRequestDataDto, options?: ServiceOptions): Promise<RequestDataDto> {
    try {
      if (!data.requestId) {
        throw new Error('RequestId is required');
      }
      
      const response = await fetch(`/api/requests/${data.requestId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data.data || {} }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error creating request data for request ${data.requestId}:`, await response.text());
        throw new Error('Failed to create request data');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      logger.error(`Error in RequestDataService.createRequestData:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Update request data with version history
   */
  async updateRequestData(id: number, data: UpdateRequestDataDto, options?: ServiceOptions): Promise<RequestDataDto> {
    try {
      const requestData = await this.getById(id, options);
      if (!requestData) {
        throw new Error(`Request data with ID ${id} not found`);
      }
      
      const response = await fetch(`/api/requests/data/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data.data || {} }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error updating request data ${id}:`, await response.text());
        throw new Error('Failed to update request data');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      logger.error(`Error in RequestDataService.updateRequestData(${id}):`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Get history of changes for request data
   */
  async getRequestDataHistory(id: number, options?: ServiceOptions): Promise<RequestDataHistoryDto[]> {
    try {
      const response = await fetch(`/api/requests/data/${id}/history`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error fetching request data history for ${id}:`, await response.text());
        return [];
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      logger.error(`Error in RequestDataService.getRequestDataHistory(${id}):`, error as Error);
      return [];
    }
  }
  
  /**
   * Create or update request data
   */
  async saveData(requestId: number, data: Record<string, any>, options?: ServiceOptions): Promise<RequestDataDto> {
    try {
      const response = await fetch(`/api/requests/${requestId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error saving request data for request ${requestId}:`, await response.text());
        throw new Error('Failed to save request data');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      logger.error(`Error in RequestDataService.saveData(${requestId}):`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get data history for a request
   */
  async getHistory(requestId: number, options?: ServiceOptions): Promise<RequestDataHistory[]> {
    try {
      const response = await fetch(`/api/requests/${requestId}/data/history`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error fetching request data history for request ${requestId}:`, await response.text());
        return [];
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      logger.error(`Error in RequestDataService.getHistory(${requestId}):`, error as Error);
      return [];
    }
  }
  
  /**
   * Method stubs for IBaseService interface
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<RequestDataDto>> {
    logger.warn('RequestDataService.getAll called on client-side - not implemented');
    return {
      data: [],
      pagination: {
        page: options?.page || 1,
        limit: options?.limit || 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  async getById(id: number, options?: ServiceOptions): Promise<RequestDataDto | null> {
    try {
      const response = await fetch(`/api/requests/data/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error fetching request data ${id}:`, await response.text());
        return null;
      }
      
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      logger.error(`Error in RequestDataService.getById(${id}):`, error as Error);
      return null;
    }
  }

  async create(data: CreateRequestDataDto, options?: ServiceOptions): Promise<RequestDataDto> {
    try {
      if (!data.requestId) {
        throw new Error('RequestId is required');
      }
      
      return await this.saveData(data.requestId, data.data || {}, options);
    } catch (error) {
      logger.error('Error in RequestDataService.create:', error as Error);
      throw error;
    }
  }

  async update(id: number, data: UpdateRequestDataDto, options?: ServiceOptions): Promise<RequestDataDto> {
    try {
      const requestData = await this.getById(id, options);
      if (!requestData) {
        throw new Error(`Request data with ID ${id} not found`);
      }
      
      return await this.saveData(requestData.requestId, data.data || {}, options);
    } catch (error) {
      logger.error(`Error in RequestDataService.update(${id}):`, error as Error);
      throw error;
    }
  }

  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await fetch(`/api/requests/data/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error(`Error deleting request data ${id}:`, await response.text());
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Error in RequestDataService.delete(${id}):`, error as Error);
      return false;
    }
  }

  async validate(data: any, isUpdate?: boolean, entityId?: number): Promise<any> {
    // Simple client-side validation
    return { isValid: true };
  }

  async transaction<T>(callback: (service: IRequestDataService) => Promise<T>): Promise<T> {
    // No transaction support on client side, just execute the callback
    return callback(this);
  }

  toDTO(entity: RequestData): RequestDataDto {
    return {
      id: entity.id,
      requestId: entity.requestId,
      category: entity.category,
      label: entity.label,
      order: entity.order,
      dataType: entity.dataType,
      isValid: entity.isValid,
      processedBy: entity.processedBy,
      version: entity.version,
      createdById: entity.createdById,
      data: entity.data,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : String(entity.createdAt),
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : String(entity.updatedAt)
    };
  }

  fromDTO(dto: RequestDataDto): Partial<RequestData> {
    return {
      id: dto.id,
      requestId: dto.requestId,
      category: dto.category,
      label: dto.label,
      order: dto.order,
      dataType: dto.dataType,
      isValid: dto.isValid,
      processedBy: dto.processedBy,
      version: dto.version,
      createdById: dto.createdById,
      data: dto.data,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date()
    };
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<RequestDataDto[]> {
    logger.warn('RequestDataService.findByCriteria called on client-side - not implemented');
    return [];
  }

  async bulkUpdate(ids: number[], data: Partial<RequestData>, options?: ServiceOptions): Promise<number> {
    logger.warn('RequestDataService.bulkUpdate called on client-side - not implemented');
    return 0;
  }

  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const url = new URL('/api/requests/data/count', window.location.origin);
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        logger.error('Error fetching request data count:', await response.text());
        return 0;
      }
      
      const result = await response.json();
      return result.data?.count || 0;
    } catch (error) {
      logger.error('Error in RequestDataService.count:', error as Error);
      return 0;
    }
  }

  async search(searchText: string, options?: ServiceOptions): Promise<RequestDataDto[]> {
    logger.warn('RequestDataService.search called on client-side - not implemented');
    return [];
  }

  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const requestData = await this.getById(id, options);
      return !!requestData;
    } catch {
      return false;
    }
  }

  getRepository(): any {
    logger.warn('RequestDataService.getRepository called on client-side - not applicable');
    return null;
  }

  async findAll(options?: ServiceOptions): Promise<PaginationResult<RequestDataDto>> {
    logger.warn('RequestDataService.findAll called on client-side - not implemented');
    return {
      data: [],
      pagination: {
        page: options?.page || 1,
        limit: options?.limit || 10,
        total: 0,
        totalPages: 0
      }
    };
  }
}