import { BaseRepository } from '../utils/base.repository.js';
import { Customer } from '../types/models/index.js';
import { CustomerFilterParams } from '../types/dtos/customer.dto.js';
import { QueryBuilder } from '../utils/data.utils.js';
import { inject } from '../config/dependency-container.js';
import { PrismaClient } from '@prisma/client';

export class CustomerRepository extends BaseRepository<Customer, CustomerFilterParams> {
  constructor() {
    // Get PrismaClient instance from dependency container or create new one
    const prisma = inject<PrismaClient>('PrismaClient');
    super(prisma, prisma.customer);
  }
  
  /**
   * Build Prisma where conditions from filter parameters
   * @param filters Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: CustomerFilterParams): any {
    const queryBuilder = new QueryBuilder();
    
    // Add status filter if provided
    if (filters.status) {
      queryBuilder.addFilter('status', filters.status);
    }
    
    // Add type filter if provided
    if (filters.type) {
      queryBuilder.addFilter('type', filters.type);
    }
    
    // Add search across multiple fields if provided
    if (filters.search) {
      queryBuilder.addSearch(filters.search, ['name', 'email', 'company', 'phone']);
    }
    
    return queryBuilder.build();
  }
}