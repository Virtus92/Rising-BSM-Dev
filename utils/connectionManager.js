const pool = require('../services/db.service').pool;

/**
 * Manages database connections for controllers
 */
class ConnectionManager {
  /**
   * Execute a query with automatic connection handling
   * @param {Function} callback - Function that receives a client and executes queries
   * @returns {Promise<any>} - Query result
   */
  static async withConnection(callback) {
    const client = await pool.connect();
    try {
      return await callback(client);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute queries in a transaction
   * @param {Function} callback - Function that receives a client and executes queries
   * @returns {Promise<any>} - Transaction result
   */
  static async withTransaction(callback) {
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
  }
}

module.exports = ConnectionManager;