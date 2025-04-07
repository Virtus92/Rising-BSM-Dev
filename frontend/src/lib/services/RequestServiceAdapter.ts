import { ContactRequest } from '../entities/ContactRequest.js';
import { IBaseService, ServiceOptions } from '../interfaces/IBaseService.js';
import { IRequestService } from '../lib/interfaces/IRequestService.js';
import { 
  CreateRequestDto, 
  UpdateRequestDto, 
  RequestResponseDto,
  PaginatedRequestsResponse
} from '../dtos/RequestDtos.js';
import { SortOrder } from '../core/BaseRepository.js';

/**
 * Adapter for RequestService to match the IBaseService interface
 * This allows using the RequestService with the BaseController
 */
export class RequestServiceAdapter implements IBaseService<ContactRequest, CreateRequestDto, UpdateRequestDto, RequestResponseDto, number> {
  constructor(private requestService: IRequestService) {}

  async getAll(options?: { page?: number; limit?: number; sortBy?: string; sortOrder?: SortOrder; }): Promise<PaginatedRequestsResponse> {
    return this.requestService.getRequests({
      page: options?.page,
      limit: options?.limit,
      sortBy: options?.sortBy,
      sortDirection: options?.sortOrder === 'ASC' ? 'asc' : 'desc'
    });
  }

  async getById(id: number): Promise<ContactRequest> {
    return this.requestService.getRequestById(id);
  }

  async create(data: CreateRequestDto, options?: ServiceOptions): Promise<ContactRequest> {
    return this.requestService.createRequest(data, options);
  }

  async update(id: number, data: UpdateRequestDto, options?: ServiceOptions): Promise<ContactRequest> {
    // This is a partial implementation, as RequestService doesn't have a direct update method
    // We're using updateRequestStatus as a fallback
    return this.requestService.updateRequestStatus(id, { status: data.status || 'neu' }, options);
  }

  async delete(id: number): Promise<void> {
    // This is a no-op as we don't support deletion of contact requests
    throw new Error('Delete operation not supported for contact requests');
  }
  
  async count(): Promise<number> {
    const result = await this.requestService.getRequests({ page: 1, limit: 1 });
    return result.pagination.total;
  }
  
  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.requestService.getRequestById(id);
      return !!result;
    } catch (error) {
      return false;
    }
  }
  
  async findByCriteria(criteria: Record<string, any>, options?: { page?: number; limit?: number; }): Promise<PaginatedRequestsResponse> {
    return this.requestService.getRequests({
      ...criteria,
      page: options?.page,
      limit: options?.limit
    });
  }
}