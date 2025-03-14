const pool = require('./db.service');

class ConnectionManager {
  static async withConnection(callback) {
    const client = await pool.connect();
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }
}

module.exports = ConnectionManager;