// PostgreSQL-Verbindung einrichten
const { Pool } = require('pg');

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

// Verbindungsstatus prüfen
pool.on('error', (err) => {
  console.error('Unerwarteter Fehler bei der Datenbankverbindung', err);
  process.exit(-1);
});

export default pool;