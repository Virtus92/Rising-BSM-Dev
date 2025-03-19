"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.countBy = exports.findBy = exports.deleteById = exports.update = exports.insert = exports.getById = exports.transaction = exports.query = void 0;
/**
 * LEGACY Database service - scheduled for removal
 * Provides a centralized interface for all database operations
 * @deprecated Use Prisma client directly instead of this service
 */
const pg_1 = require("pg");
const errors_1 = require("../utils/errors");
const prisma_utils_1 = __importDefault(require("../utils/prisma.utils"));
// Create a new connection pool
const pool = new pg_1.Pool({
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
pool.on('error', (err) => {
    console.error('Unexpected database pool error', err);
    process.exit(-1);
});
/**
 * Execute a query with parameters
 * @param query SQL query string or object with text and values
 * @param params Query parameters (if query is a string)
 * @returns Query result
 * @throws DatabaseError
 */
const query = async (queryText, params = []) => {
    console.warn('⚠️ Warning: Legacy db.query is being used. Consider migrating to Prisma directly.');
    try {
        // Execute raw query using Prisma
        // Type casting is used here because of typing limitations
        const result = await prisma_utils_1.default.$queryRawUnsafe(queryText, ...params);
        return {
            rows: result,
            rowCount: result.length
        };
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Database query failed: ${error.message}`, { query: queryText, params, error });
    }
};
exports.query = query;
// Wrapper for transaction support
const transaction = async (callback) => {
    try {
        return await prisma_utils_1.default.$transaction(async (prismaClient) => {
            return callback(prismaClient);
        });
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Transaction failed: ${error.message}`, { error });
    }
};
exports.transaction = transaction;
// Legacy getById implementation
const getById = async (table, id, idColumn = 'id') => {
    try {
        const whereClause = {};
        whereClause[idColumn] = typeof id === 'string' ? parseInt(id, 10) : id;
        const result = await prisma_utils_1.default[table].findUnique({
            where: whereClause
        });
        return result;
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Failed to get row by ID: ${error.message}`, { table, id, idColumn, error });
    }
};
exports.getById = getById;
/**
 * Insert a row and return the created object
 * @param table Table name
 * @param data Object with column:value pairs to insert
 * @param returning What to return
 * @returns Created row
 * @throws DatabaseError
 */
const insert = async (table, data, returning = '*') => {
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
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Insert operation failed: ${error.message}`, { table, data, error });
    }
};
exports.insert = insert;
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
const update = async (table, id, data, idColumn = 'id', returning = '*') => {
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
        const result = await pool.query(query, [...values, id]);
        if (result.rows.length === 0) {
            throw new Error(`Record with ID ${id} not found`);
        }
        return result.rows[0];
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Update operation failed: ${error.message}`, { table, id, data, error });
    }
};
exports.update = update;
/**
 * Delete a row by ID
 * @param table Table name
 * @param id ID of row to delete
 * @param idColumn Column name for ID
 * @returns True if deleted, false if not found
 * @throws DatabaseError
 */
const deleteById = async (table, id, idColumn = 'id') => {
    try {
        const result = await (0, exports.query)(`DELETE FROM ${table} WHERE ${idColumn} = $1 RETURNING ${idColumn}`, [id]);
        return result.rowCount > 0;
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Delete operation failed: ${error.message}`, { table, id, error });
    }
};
exports.deleteById = deleteById;
/**
 * Find rows by custom criteria
 * @param table Table name
 * @param criteria Object with column:value pairs as criteria
 * @param options Query options (limit, offset, orderBy)
 * @returns Array of matching rows
 * @throws DatabaseError
 */
const findBy = async (table, criteria = {}, options = {}) => {
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
        const result = await (0, exports.query)(queryText, values);
        return result.rows;
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Find operation failed: ${error.message}`, { table, criteria, options, error });
    }
};
exports.findBy = findBy;
/**
 * Count rows by custom criteria
 * @param table Table name
 * @param criteria Object with column:value pairs as criteria
 * @returns Count of matching rows
 * @throws DatabaseError
 */
const countBy = async (table, criteria = {}) => {
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
        const result = await (0, exports.query)(queryText, values);
        return parseInt(result.rows[0].count, 10);
    }
    catch (error) {
        throw new errors_1.DatabaseError(`Count operation failed: ${error.message}`, { table, criteria, error });
    }
};
exports.countBy = countBy;
// Singleton export pattern
exports.db = {
    pool,
    query: exports.query,
    transaction: exports.transaction,
    getById: exports.getById,
    insert: exports.insert,
    update: exports.update,
    delete: exports.deleteById,
    findBy: exports.findBy,
    countBy: exports.countBy
};
exports.default = exports.db;
//# sourceMappingURL=db.service.bak.js.map