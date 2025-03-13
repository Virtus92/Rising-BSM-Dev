export * from './appointment';
export * from './auth';
export * from './customer';
export * from './dashboard';
export * from './project';
export * from './request';
export * from './service';

// Common types used across multiple entities
export type StatusType = 
  | 'geplant' 
  | 'bestaetigt' 
  | 'abgeschlossen' 
  | 'storniert'
  | 'neu'
  | 'in_bearbeitung'
  | 'beantwortet'
  | 'geschlossen';

// Common API response format
export interface Pagination {
  current: number;
  limit: number;
  total: number;
  totalRecords: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  filters?: Record<string, any>;
  message?: string;
}