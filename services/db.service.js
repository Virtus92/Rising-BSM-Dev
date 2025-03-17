 /**
 * Database service 
 * Provides a centralized interface for all database operations
 */
const { Pool } = require('pg');

// Create a new connection pool
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param {string|object} query - SQL query string or object with text and values
 * @param {Array} [params] - Query parameters (if query is a string)
 * @returns {Promise<object>} - Query result
 */
exports.query = async (query, params = []) => {
  const client = await pool.connect();
  try {
    // Handle both string queries and object queries
    if (typeof query === 'string') {
      return await client.query(query, params);
    } else {
      return await client.query(query);
    }
  } finally {
    client.release();
    if (typeof mockClient !== 'undefined') {
      mockClient.release();
    }
  }
};

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Function that receives a client and executes queries
 * @returns {Promise<any>} - Result of the callback function
 */
exports.transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get a single row by ID
 * @param {string} table - Table name
 * @param {number|string} id - ID to look up
 * @param {string} [idColumn='id'] - Column name for ID
 * @returns {Promise<object|null>} - Row object or null if not found
 */
exports.getById = async (table, id, idColumn = 'id') => {
  const result = await pool.query(`SELECT * FROM ${table} WHERE ${idColumn} = $1`, [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Insert a row and return the created object
 * @param {string} table - Table name
 * @param {object} data - Object with column:value pairs to insert
 * @param {string} [returning='*'] - What to return
 * @returns {Promise<object>} - Created row
 */
exports.insert = async (table, data, returning = '*') => {
  const columns = Object.keys(data);
  const values = Object.values(data);
  
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const columnList = columns.join(', ');
  
  const query = `
    INSERT INTO ${table} (${columnList})
    VALUES (${placeholders})
    RETURNING ${returning}
  `;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Update a row by ID and return the updated object
 * @param {string} table - Table name
 * @param {number|string} id - ID of row to update
 * @param {object} data - Object with column:value pairs to update
 * @param {string} [idColumn='id'] - Column name for ID
 * @param {string} [returning='*'] - What to return
 * @returns {Promise<object>} - Updated row
 */
exports.update = async (table, id, data, idColumn = 'id', returning = '*') => {
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
  
  const result = await pool.query(query, [...values, id]);
  return result.rows[0];
};

/**
 * Delete a row by ID
 * @param {string} table - Table name
 * @param {number|string} id - ID of row to delete
 * @param {string} [idColumn='id'] - Column name for ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
exports.delete = async (table, id, idColumn = 'id') => {
  const result = await pool.query(`DELETE FROM ${table} WHERE ${idColumn} = $1 RETURNING ${idColumn}`, [id]);
  return result.rowCount > 0;
};

// Export the pool for direct access if needed
exports.pool = pool;