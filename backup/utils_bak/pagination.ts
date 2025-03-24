import config from '../config/index.js';

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface PaginationResult {
  current: number;
  limit: number;
  total: number;
  totalRecords: number;
  skip: number;
}

export function processPagination(params: PaginationParams): PaginationResult {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(
    config.MAX_PAGE_SIZE, 
    Math.max(1, Number(params.limit) || config.DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;
  
  return {
    current: page,
    limit,
    total: 0, // Will be filled later
    totalRecords: 0, // Will be filled later
    skip
  };
}

export function completePagination(
  pagination: PaginationResult, 
  totalRecords: number
): PaginationResult {
  const totalPages = Math.ceil(totalRecords / pagination.limit);
  
  return {
    ...pagination,
    total: totalPages,
    totalRecords
  };
}
