/**
 * Database service
 * Provides a centralized interface for all database operations
 */
import { Pool, PoolClient, QueryConfig, QueryResult } from 'pg';
import { DatabaseError } from '../utils/errors';

// Create a new connection pool
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected database pool error', err);
  process.exit(-1);
});

/**
 * Type for query parameters
 */
type QueryParams = any[] | Record<string, any>;

/**
 * Execute a query with parameters
 * @param query SQL query string or object with text and values
 * @param params Query parameters (if query is a string)
 * @returns Query result
 * @throws DatabaseError
 */
export const query = async <T = any>(
  query: string | QueryConfig,
  params: QueryParams = []
): Promise<QueryResult<T>> => {
  const client = await pool.connect();
  try {
    // Handle both string queries and object queries
    if (typeof query === 'string') {
      return await client.query(query, params);
    } else {
      return await client.query(query);
    }
  } catch (error) {
    throw new DatabaseError(
      `Database query failed: ${(error as Error).message}`,
      { query, params, error }
    );
  } finally {
    client.release();
  }
};

/**
 * Execute multiple queries in a transaction
 * @param callback Function that receives a client and executes queries
 * @returns Result of the callback function
 * @throws DatabaseError
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw new DatabaseError(
      `Transaction failed: ${(error as Error).message}`,
      { error }
    );
  } finally {
    client.release();
  }
};

/**
 * Get a single row by ID
 * @param table Table name
 * @param id ID to look up
 * @param idColumn Column name for ID
 * @returns Row object or null if not found
 * @throws DatabaseError
 */
export const getById = async <T = Record<string, any>>(
  table: string, 
  id: number | string, 
  idColumn = 'id'
): Promise<T | null> => {
  try {
    const result = await query<T>(`SELECT * FROM ${table} WHERE ${idColumn} = $1`, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new DatabaseError(
      `Failed to get row by ID: ${(error as Error).message}`,
      { table, id, idColumn, error }
    );
  }
};

/**
 * Insert a row and return the created object
 * @param table Table name
 * @param data Object with column:value pairs to insert
 * @param returning What to return
 * @returns Created row
 * @throws DatabaseError
 */
export const insert = async <T = Record<string, any>>(
  table: string, 
  data: Record<string, any>, 
  returning = '*'
): Promise<T> => {
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const columnList = columns.join(', ');
    
    const query = `
      INSERT INTO ${table} (${columnList})
      VALUES (${placeholders})
      RETURNING ${returning}
    `;
    
    const result = await pool.query<T>(query, values);
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(
      `Insert operation failed: ${(error as Error).message}`,
      { table, data, error }
    );
  }
};

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
export const update = async <T = Record<string, any>>(
  table: string, 
  id: number | string, 
  data: Record<string, any>, 
  idColumn = 'id', 
  returning = '*'
): Promise<T> => {
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = columns
      .map((column, index) => `${column} = $${index + 1}`)
      .join(', ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${idColumn} = $${columns.length + 1}
      RETURNING ${returning}
    `;
    
    const result = await pool.query<T>(query, [...values, id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Record with ID ${id} not found`);
    }
    
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(
      `Update operation failed: ${(error as Error).message}`,
      { table, id, data, error }
    );
  }
};

/**
 * Delete a row by ID
 * @param table Table name
 * @param id ID of row to delete
 * @param idColumn Column name for ID
 * @returns True if deleted, false if not found
 * @throws DatabaseError
 */
export const deleteById = async (
  table: string, 
  id: number | string, 
  idColumn = 'id'
): Promise<boolean> => {
  try {
    const result = await query(
      `DELETE FROM ${table} WHERE ${idColumn} = $1 RETURNING ${idColumn}`, 
      [id]
    );
    return result.rowCount > 0;
  } catch (error) {
    throw new DatabaseError(
      `Delete operation failed: ${(error as Error).message}`,
      { table, id, error }
    );
  }
};

/**
 * Find rows by custom criteria
 * @param table Table name
 * @param criteria Object with column:value pairs as criteria
 * @param options Query options (limit, offset, orderBy)
 * @returns Array of matching rows
 * @throws DatabaseError
 */
export const findBy = async <T = Record<string, any>>(
  table: string,
  criteria: Record<string, any> = {},
  options: { 
    limit?: number; 
    offset?: number; 
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC'
  } = {}
): Promise<T[]> => {
  try {
    const { limit, offset, orderBy = 'id', orderDirection = 'ASC' } = options;
    
    const columns = Object.keys(criteria);
    const values = Object.values(criteria);
    
    let whereClause = '';
    if (columns.length > 0) {
      const conditions = columns
        .map((column, index) => `${column} = $${index + 1}`)
        .join(' AND ');
      whereClause = `WHERE ${conditions}`;
    }
    
    // Build pagination and order
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const offsetClause = offset ? `OFFSET ${offset}` : '';
    const orderClause = `ORDER BY ${orderBy} ${orderDirection}`;
    
    const queryText = `
      SELECT * FROM ${table}
      ${whereClause}
      ${orderClause}
      ${limitClause}
      ${offsetClause}
    `;
    
    const result = await query<T>(queryText, values);
    return result.rows;
  } catch (error) {
    throw new DatabaseError(
      `Find operation failed: ${(error as Error).message}`,
      { table, criteria, options, error }
    );
  }
};

/**
 * Count rows by custom criteria
 * @param table Table name
 * @param criteria Object with column:value pairs as criteria
 * @returns Count of matching rows
 * @throws DatabaseError
 */
export const countBy = async (
  table: string,
  criteria: Record<string, any> = {}
): Promise<number> => {
  try {
    const columns = Object.keys(criteria);
    const values = Object.values(criteria);
    
    let whereClause = '';
    if (columns.length > 0) {
      const conditions = columns
        .map((column, index) => `${column} = $${index + 1}`)
        .join(' AND ');
      whereClause = `WHERE ${conditions}`;
    }
    
    const queryText = `
      SELECT COUNT(*) FROM ${table}
      ${whereClause}
    `;
    
    const result = await query<{ count: string }>(queryText, values);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    throw new DatabaseError(
      `Count operation failed: ${(error as Error).message}`,
      { table, criteria, error }
    );
  }
};

// Singleton export pattern
export const db = {
  pool,
  query,
  transaction,
  getById,
  insert,
  update,
  delete: deleteById, // Renamed function to avoid JS reserved keyword
  findBy,
  countBy
};

export default db;