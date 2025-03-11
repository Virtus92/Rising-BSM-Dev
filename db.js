// PostgreSQL-Verbindung einrichten
import pg from 'pg';
const { Pool } = pg;

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

/**
 * Führt eine SQL-Abfrage aus und gibt das Ergebnis zurück
 * @param {string|object} queryTextOrConfig - SQL-Abfrage oder Konfigurationsobjekt
 * @param {Array} params - Parameter für Prepared Statement
 * @returns {Promise<object>} - Query-Ergebnis
 */
export const query = async (queryTextOrConfig, params = []) => {
  try {
    return await pool.query(queryTextOrConfig, params);
  } catch (error) {
    console.error('Datenbankfehler:', error);
    throw error;
  }
};

/**
 * Führt eine SQL-Abfrage aus und gibt einen einzelnen Datensatz zurück
 * @param {string|object} queryTextOrConfig - SQL-Abfrage oder Konfigurationsobjekt
 * @param {Array} params - Parameter für Prepared Statement
 * @returns {Promise<object|null>} - Ein einzelnes Objekt oder null
 */
export const getOne = async (queryTextOrConfig, params = []) => {
  const result = await query(queryTextOrConfig, params);
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Führt eine SQL-Abfrage aus und gibt alle Datensätze zurück
 * @param {string|object} queryTextOrConfig - SQL-Abfrage oder Konfigurationsobjekt
 * @param {Array} params - Parameter für Prepared Statement
 * @returns {Promise<Array>} - Array von Objekten
 */
export const getMany = async (queryTextOrConfig, params = []) => {
  const result = await query(queryTextOrConfig, params);
  return result.rows;
};

/**
 * Führt eine SQL-Abfrage aus und gibt die Anzahl der Treffer zurück
 * @param {string} queryText - SQL-Abfrage 
 * @param {Array} params - Parameter für Prepared Statement
 * @returns {Promise<number>} - Anzahl
 */
export const getCount = async (queryText, params = []) => {
  const result = await query(queryText, params);
  return parseInt(result.rows[0]?.count || 0);
};

/**
 * Führt eine SQL-Insert-Abfrage aus und gibt die ID des neuen Datensatzes zurück
 * @param {string} table - Tabellenname 
 * @param {object} data - Einzufügende Daten als Objekt
 * @param {string} returnColumn - Spalte, die zurückgegeben werden soll (z.B. 'id')
 * @returns {Promise<any>} - Rückgabewert (z.B. ID)
 */
export const insert = async (table, data, returnColumn = 'id') => {
  const keys = Object.keys(data);
  const columns = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = Object.values(data);

  const query = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    RETURNING ${returnColumn}
  `;

  const result = await pool.query(query, values);
  return result.rows[0][returnColumn];
};

/**
 * Führt eine SQL-Update-Abfrage aus
 * @param {string} table - Tabellenname 
 * @param {string|number} id - ID des zu aktualisierenden Datensatzes
 * @param {object} data - Zu aktualisierende Daten als Objekt
 * @param {string} idColumn - Name der ID-Spalte (Standard: 'id')
 * @returns {Promise<boolean>} - true bei Erfolg
 */
export const update = async (table, id, data, idColumn = 'id') => {
  const keys = Object.keys(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), id];

  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${idColumn} = $${values.length}
  `;

  const result = await pool.query(query, values);
  return result.rowCount > 0;
};

/**
 * Führt eine SQL-Delete-Abfrage aus
 * @param {string} table - Tabellenname 
 * @param {string|number} id - ID des zu löschenden Datensatzes
 * @param {string} idColumn - Name der ID-Spalte (Standard: 'id')
 * @returns {Promise<boolean>} - true bei Erfolg
 */
export const remove = async (table, id, idColumn = 'id') => {
  const query = `DELETE FROM ${table} WHERE ${idColumn} = $1`;
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
};

// Exportiere auch den Pool für spezielle Anwendungsfälle
export default pool;