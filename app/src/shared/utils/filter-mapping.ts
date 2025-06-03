/**
 * Generic utility for mapping service filters to repository criteria
 * This ensures consistent filter handling across all services
 */

/**
 * Maps service-level filters to repository criteria
 * @param filters - The filters object from service options
 * @param fieldMappings - Optional field name mappings (e.g., { zipCode: 'postalCode' })
 * @returns Repository-compatible criteria object
 */
export function mapFiltersToRepositoryCriteria(
  filters?: Record<string, any>,
  fieldMappings?: Record<string, string>
): Record<string, any> {
  if (!filters) {
    return {};
  }
  
  const criteria: Record<string, any> = {};
  
  // Process each filter
  Object.entries(filters).forEach(([key, value]) => {
    // Skip undefined, null, or empty string values
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Apply field mapping if provided
    const mappedKey = fieldMappings?.[key] || key;
    
    // Handle different value types
    if (key.endsWith('After') || key.endsWith('Before') || key.endsWith('From') || key.endsWith('To')) {
      // Date filters - ensure they're Date objects
      criteria[mappedKey] = value instanceof Date ? value : new Date(value);
    } else if (key === 'search' || key === 'searchTerm' || key === 'query') {
      // Search filters - always map to 'search' for consistency
      criteria.search = String(value);
    } else if (typeof value === 'boolean') {
      // Boolean filters
      criteria[mappedKey] = value;
    } else if (Array.isArray(value)) {
      // Array filters (e.g., multiple statuses)
      if (value.length > 0) {
        criteria[mappedKey] = value;
      }
    } else {
      // All other filters
      criteria[mappedKey] = value;
    }
  });
  
  return criteria;
}

/**
 * Common field mappings for different entities
 */
export const COMMON_FIELD_MAPPINGS = {
  customer: {
    zipCode: 'postalCode',
    companyName: 'company'
  },
  appointment: {
    date: 'appointmentDate',
    startTime: 'appointmentTime'
  },
  request: {
    priority: 'priority',
    requestDate: 'createdAt'
  }
};

/**
 * Extracts pagination info from service options
 */
export function extractPaginationOptions(options?: any): {
  page: number;
  limit: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
} {
  return {
    page: options?.page || 1,
    limit: Math.min(options?.limit || 10, 100), // Cap at 100 for safety
    sort: options?.sort
  };
}

/**
 * Builds QueryOptions for repository methods
 */
export function buildQueryOptions(
  options?: any,
  additionalOptions?: any
): any {
  const { page, limit, sort } = extractPaginationOptions(options);
  
  return {
    page,
    limit,
    sort,
    relations: options?.relations || [],
    ...additionalOptions
  };
}
