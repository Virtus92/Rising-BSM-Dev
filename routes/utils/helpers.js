/**
 * Utility-Funktionen für das Dashboard
 */

const { formatDistanceToNow, isToday, isTomorrow, format } = require('date-fns');
const { de } = require('date-fns/locale');
const pool = require('../../db');

/**
 * Führt eine Datenbankabfrage aus und gibt die Anzahl zurück.
 * @param {string} query - Die SQL-Abfrage.
 * @param {array} params - Parameter für die SQL-Abfrage.
 * @returns {number} - Die Anzahl aus der Datenbank.
 */
async function getCountFromDB(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count || 0, 10);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anzahl aus der Datenbank:', error);
    return 0;
  }
}

/**
 * Formatiert ein Datum sicher in ein lesbares Format.
 * @param {string|Date} date - Das zu formatierende Datum.
 * @param {string} formatString - Das Format, in das das Datum umgewandelt werden soll.
 * @returns {string} - Das formatierte Datum oder 'Unbekannt', wenn ein Fehler auftritt.
 */
function formatDateSafely(date, formatString) {
  try {
    if (!date) return 'Unbekannt';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      console.error(`Ungültiges Datumsformat für Datum: ${date} mit Format: ${formatString}`);
      return 'Ungültiges Datum';
    }
    return format(parsedDate, formatString);
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error);
    return 'Unbekannt';
  }
}

/**
 * Generiert Statusinformationen für eine Anfrage.
 * @param {string} status - Der Status der Anfrage.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
function getAnfrageStatusInfo(status) {
  switch (status) {
    case 'neu':
      return { label: 'Neu', className: 'warning' };
    case 'in_bearbeitung':
      return { label: 'In Bearbeitung', className: 'info' };
    case 'beantwortet':
      return { label: 'Beantwortet', className: 'success' };
    default:
      return { label: 'Geschlossen', className: 'secondary' };
  }
}

/**
 * Generiert Statusinformationen für einen Termin.
 * @param {string} status - Der Status des Termins.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
function getTerminStatusInfo(status) {
  switch (status) {
    case 'geplant':
      return { label: 'Geplant', className: 'warning' };
    case 'bestaetigt':
      return { label: 'Bestätigt', className: 'success' };
    case 'abgeschlossen':
      return { label: 'Abgeschlossen', className: 'primary' };
    default:
      return { label: 'Storniert', className: 'secondary' };
  }
}

/**
 * Generiert Statusinformationen für ein Projekt.
 * @param {string} status - Der Status des Projekts.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
function getProjektStatusInfo(status) {
  switch (status) {
    case 'neu':
      return { label: 'Neu', className: 'info' };
    case 'in_bearbeitung':
      return { label: 'In Bearbeitung', className: 'primary' };
    case 'abgeschlossen':
      return { label: 'Abgeschlossen', className: 'success' };
    default:
      return { label: 'Storniert', className: 'secondary' };
  }
}

/**
 * Ruft Benachrichtigungen aus der Datenbank ab.
 * @param {object} req - Das Request-Objekt von Express.
 * @returns {object} - Ein Objekt mit Benachrichtigungselementen, ungelesener Anzahl und Gesamtanzahl.
 */
async function getNotifications(req) {
  try {
    const notificationsQuery = await pool.query(`
      SELECT
        id,
        typ,
        titel,
        erstellt_am,
        gelesen,
        referenz_id
      FROM
        benachrichtigungen
      WHERE
        benutzer_id = $1
      ORDER BY
        erstellt_am DESC
      LIMIT 5
    `, [req.session.user.id]);

    const unreadCount = await getCountFromDB(
      `SELECT COUNT(*) FROM benachrichtigungen WHERE benutzer_id = $1 AND gelesen = false`,
      [req.session.user.id]
    );

    const totalCount = await getCountFromDB(
      `SELECT COUNT(*) FROM benachrichtigungen WHERE benutzer_id = $1`,
      [req.session.user.id]
    );

    return {
      items: notificationsQuery.rows.map(n => ({
        id: n.id,
        title: n.titel,
        type: n.typ === 'anfrage' ? 'success' : n.typ === 'termin' ? 'primary' : n.typ === 'warnung' ? 'warning' : 'info',
        icon: n.typ === 'anfrage' ? 'envelope' : n.typ === 'termin' ? 'calendar-check' : n.typ === 'warnung' ? 'exclamation-triangle' : 'bell',
        time: formatDistanceToNow(new Date(n.erstellt_am), { addSuffix: true, locale: de }),
        link: n.typ === 'anfrage' ? `/dashboard/anfragen/${n.referenz_id}` :
          n.typ === 'termin' ? `/dashboard/termine/${n.referenz_id}` :
            n.typ === 'auftrag' ? `/dashboard/projekte/${n.referenz_id}` :
              '/dashboard/notifications'
      })),
      unreadCount: unreadCount,
      totalCount: totalCount
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
    return { items: [], unreadCount: 0, totalCount: 0 };
  }
}

/**
 * Verbesserte Datenabfragen mit Caching-Unterstützung
 * @param {string} cacheKey - Schlüssel für den Cache
 * @param {string} query - SQL-Abfrage
 * @param {Array} params - Parameter für die SQL-Abfrage
 * @param {number} ttlSeconds - Cache-Gültigkeitsdauer in Sekunden
 * @returns {Array} - Die Abfrageergebnisse
 */
async function getCachedOrFreshData(cacheKey, query, params = [], ttlSeconds = 300) {
  // Hier könnte ein Redis- oder In-Memory-Cache verwendet werden
  // Für dieses Beispiel implementieren wir einen einfachen In-Memory-Cache
  if (!global.dashboardCache) {
    global.dashboardCache = {};
  }
  
  const cache = global.dashboardCache;
  const now = Date.now();
  
  if (cache[cacheKey] && cache[cacheKey].expiry > now) {
    console.log(`Cache hit for ${cacheKey}`);
    return cache[cacheKey].data;
  }
  
  console.log(`Cache miss for ${cacheKey}, fetching fresh data`);
  const result = await pool.query(query, params);
  
  cache[cacheKey] = {
    data: result.rows,
    expiry: now + (ttlSeconds * 1000)
  };
  
  return result.rows;
}

/**
 * Auth Middleware zur Überprüfung, ob der Benutzer angemeldet ist
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    console.log("Auth failed, redirecting to login");
    return res.redirect('/login');
  }
};

// Middleware to get new requests count
const getNewRequestsCountMiddleware = async (req, res, next) => {
  try {
    req.newRequestsCount = await getCountFromDB("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    next();
  } catch (error) {
    console.error('Error fetching new requests count:', error);
    req.newRequestsCount = 0; // Default value in case of error
    next();
  }
};

// Export der Hilfsfunktionen
module.exports = {
  getCountFromDB,
  formatDateSafely,
  getAnfrageStatusInfo,
  getTerminStatusInfo,
  getProjektStatusInfo,
  getNotifications,
  getCachedOrFreshData,
  isAuthenticated,
  getNewRequestsCountMiddleware
};