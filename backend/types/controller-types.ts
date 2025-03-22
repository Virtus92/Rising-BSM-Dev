export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface FilterOptions extends PaginationOptions {
  status?: string;
  search?: string;
  type?: string;
  date?: string;
  [key: string]: any;
}

export interface PaginationResult {
  current: number;
  limit: number;
  total: number;
  totalRecords: number;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

export interface PaginatedResponse<T = any> extends SuccessResponse<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationResult;
  };
}

export interface ResponseMeta {
  timestamp: string;
  [key: string]: any;
}