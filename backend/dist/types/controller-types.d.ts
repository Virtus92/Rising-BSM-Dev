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
