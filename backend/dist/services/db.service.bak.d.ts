/**
 * LEGACY Database service - scheduled for removal
 * Provides a centralized interface for all database operations
 * @deprecated Use Prisma client directly instead of this service
 */
import { Pool, QueryResultRow } from 'pg';
import { PrismaClient } from '@prisma/client';
/**
 * Execute a query with parameters
 * @param query SQL query string or object with text and values
 * @param params Query parameters (if query is a string)
 * @returns Query result
 * @throws DatabaseError
 */
export declare const query: <T extends Record<string, any>>(queryText: string, params?: any[]) => Promise<{
    rows: T[];
    rowCount: number;
}>;
export declare const transaction: <T>(callback: (client: PrismaClient) => Promise<T>) => Promise<T>;
export declare const getById: <T = Record<string, any>>(table: string, id: number | string, idColumn?: string) => Promise<T | null>;
/**
 * Insert a row and return the created object
 * @param table Table name
 * @param data Object with column:value pairs to insert
 * @param returning What to return
 * @returns Created row
 * @throws DatabaseError
 */
export declare const insert: <T extends QueryResultRow = Record<string, any>>(table: string, data: Record<string, any>, returning?: string) => Promise<T>;
/**
 * Update a row by ID and return the updated object
 * @param table Table name
 * @param id ID of row to update
 * @param data Object with column:value pairs to update
 * @param idColumn Column name for ID
 * @param returning What to return
 * @returns Updated row
 * @throws DatabaseError
 */
export declare const update: <T extends QueryResultRow = Record<string, any>>(table: string, id: number | string, data: Record<string, any>, idColumn?: string, returning?: string) => Promise<T>;
/**
 * Delete a row by ID
 * @param table Table name
 * @param id ID of row to delete
 * @param idColumn Column name for ID
 * @returns True if deleted, false if not found
 * @throws DatabaseError
 */
export declare const deleteById: (table: string, id: number | string, idColumn?: string) => Promise<boolean>;
/**
 * Find rows by custom criteria
 * @param table Table name
 * @param criteria Object with column:value pairs as criteria
 * @param options Query options (limit, offset, orderBy)
 * @returns Array of matching rows
 * @throws DatabaseError
 */
export declare const findBy: <T extends Record<string, any> = Record<string, any>>(table: string, criteria?: Record<string, any>, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: "ASC" | "DESC";
}) => Promise<T[]>;
/**
 * Count rows by custom criteria
 * @param table Table name
 * @param criteria Object with column:value pairs as criteria
 * @returns Count of matching rows
 * @throws DatabaseError
 */
export declare const countBy: (table: string, criteria?: Record<string, any>) => Promise<number>;
export declare const db: {
    pool: Pool;
    query: <T extends Record<string, any>>(queryText: string, params?: any[]) => Promise<{
        rows: T[];
        rowCount: number;
    }>;
    transaction: <T>(callback: (client: PrismaClient) => Promise<T>) => Promise<T>;
    getById: <T = Record<string, any>>(table: string, id: number | string, idColumn?: string) => Promise<T | null>;
    insert: <T extends QueryResultRow = Record<string, any>>(table: string, data: Record<string, any>, returning?: string) => Promise<T>;
    update: <T extends QueryResultRow = Record<string, any>>(table: string, id: number | string, data: Record<string, any>, idColumn?: string, returning?: string) => Promise<T>;
    delete: (table: string, id: number | string, idColumn?: string) => Promise<boolean>;
    findBy: <T extends Record<string, any> = Record<string, any>>(table: string, criteria?: Record<string, any>, options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
        orderDirection?: "ASC" | "DESC";
    }) => Promise<T[]>;
    countBy: (table: string, criteria?: Record<string, any>) => Promise<number>;
};
export default db;
