/**
 * Zentrale Utility-Funktionen für das Dashboard
 */

import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import { query, getCount } from '../db.js';

// In-Memory-Cache für häufig verwendete Daten
const memoryCache = new Map();

/**
 * Führt eine Datenbankabfrage aus und gibt die Anzahl zurück.
 * @param {string} queryText - Die SQL-Abfrage.
 * @param {array} params - Parameter für die SQL-Abfrage.
 * @returns {number} - Die Anzahl aus der Datenbank.
 */
export const getCountFromDB = async (queryText, params = []) => {
  try {
    const result = await query(queryText, params);
    return parseInt(result.rows[0].count || 0, 10);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anzahl aus der Datenbank:', error);
    return 0;
  }
};

/**
 * Formatiert ein Datum sicher in ein lesbares Format.
 * @param {string|Date} date - Das zu formatierende Datum.
 * @param {string} formatString - Das Format, in das das Datum umgewandelt werden soll.
 * @returns {string} - Das formatierte Datum oder 'Unbekannt', wenn ein Fehler auftritt.
 */
export const formatDateSafely = (date, formatString) => {
  try {
    if (!date) return 'Unbekannt';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      console.error(`Ungültiges Datumsformat für Datum: ${date} mit Format: ${formatString}`);
      return 'Ungültiges Datum';
    }
    return format(parsedDate, formatString, { locale: de });
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error);
    return 'Unbekannt';
  }
};

/**
 * Hilfsfunktion: Gibt ein benutzerfreundliches relatives Datum zurück
 * @param {Date|string} date - Das zu formatierende Datum
 * @returns {string} - Heute, Morgen oder formatiertes Datum
 */
export const getRelativeDate = (date) => {
  const datumObj = new Date(date);
  
  if (isToday(datumObj)) {
    return 'Heute';
  } 
  
  if (isTomorrow(datumObj)) {
    return 'Morgen';
  }
  
  return format(datumObj, 'dd.MM.yyyy', { locale: de });
};

/**
 * Generiert Statusinformationen für eine Anfrage.
 * @param {string} status - Der Status der Anfrage.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
export const getAnfrageStatusInfo = (status) => {
  const statusMap = {
    'neu': { label: 'Neu', className: 'warning' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
    'beantwortet': { label: 'Beantwortet', className: 'success' },
    'geschlossen': { label: 'Geschlossen', className: 'secondary' }
  };
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Generiert Statusinformationen für einen Termin.
 * @param {string} status - Der Status des Termins.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
export const getTerminStatusInfo = (status) => {
  const statusMap = {
    'geplant': { label: 'Geplant', className: 'warning' },
    'bestaetigt': { label: 'Bestätigt', className: 'success' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'primary' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Generiert Statusinformationen für ein Projekt.
 * @param {string} status - Der Status des Projekts.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
export const getProjektStatusInfo = (status) => {
  const statusMap = {
    'neu': { label: 'Neu', className: 'info' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'primary' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Ruft Benachrichtigungen aus der Datenbank ab.
 * @param {object} req - Das Request-Objekt von Express.
 * @returns {object} - Ein Objekt mit Benachrichtigungselementen, ungelesener Anzahl und Gesamtanzahl.
 */
export const getNotifications = async (req) => {
  try {
    if (!req.session?.user?.id) {
      return { items: [], unreadCount: 0, totalCount: 0 };
    }
    
    const notificationsQuery = await query(`
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

    const unreadCount = await getCount(
      `SELECT COUNT(*) FROM benachrichtigungen WHERE benutzer_id = $1 AND gelesen = false`,
      [req.session.user.id]
    );

    const totalCount = await getCount(
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
      unreadCount,
      totalCount
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
    return { items: [], unreadCount: 0, totalCount: 0 };
  }
};

/**
 * Verbesserte Datenabfragen mit Caching-Unterstützung
 * @param {string} cacheKey - Schlüssel für den Cache
 * @param {string} queryText - SQL-Abfrage
 * @param {Array} params - Parameter für die SQL-Abfrage
 * @param {number} ttlSeconds - Cache-Gültigkeitsdauer in Sekunden
 * @returns {Array} - Die Abfrageergebnisse
 */
export const getCachedOrFreshData = async (cacheKey, queryText, params = [], ttlSeconds = 300) => {
  const now = Date.now();
  const cacheEntry = memoryCache.get(cacheKey);
  
  if (cacheEntry && cacheEntry.expiry > now) {
    return cacheEntry.data;
  }
  
  const result = await query(queryText, params);
  
  memoryCache.set(cacheKey, {
    data: result.rows,
    expiry: now + (ttlSeconds * 1000)
  });
  
  return result.rows;
};

/**
 * Zählt neue Anfragen
 * @returns {Promise<number>} Anzahl der neuen Anfragen
 */
export const getNewRequestsCount = async () => {
  try {
    return await getCount("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
  } catch (error) {
    console.error('Fehler beim Abrufen der neuen Anfragen:', error);
    return 0;
  }
};

/**
 * Middleware zur Abfrage der neuen Anfragen
 */
export const getNewRequestsCountMiddleware = async (req, res, next) => {
  try {
    req.newRequestsCount = await getNewRequestsCount();
    next();
  } catch (error) {
    console.error('Error fetching new requests count:', error);
    req.newRequestsCount = 0; // Default value in case of error
    next();
  }
};

/**
 * Erstellt eine komfortable Paginierung basierend auf Query-Parametern
 * @param {number} total - Gesamtanzahl der Einträge
 * @param {number} current - Aktuelle Seite
 * @param {number} limit - Einträge pro Seite
 * @returns {object} - Paginierungsobjekt mit hilfreichen Attributen
 */
export const createPagination = (total, current, limit = 20) => {
  const totalPages = Math.ceil(total / limit);
  current = Math.max(1, Math.min(current, totalPages));
  
  return {
    total: totalPages,
    current,
    limit,
    hasPrev: current > 1,
    hasNext: current < totalPages,
    prevPage: current > 1 ? current - 1 : null,
    nextPage: current < totalPages ? current + 1 : null,
    offset: (current - 1) * limit,
    showing: {
      from: Math.min(total, (current - 1) * limit + 1),
      to: Math.min(total, current * limit),
      total
    }
  };
};

/**
 * Erstellt einheitliche Filter-Bedingungen für SQL-Abfragen
 * @param {object} filters - Filter-Objekt vom Frontend
 * @param {object} mappings - Abbildung von Frontend- auf Datenbankfelder
 * @returns {object} - Objekt mit where-Klausel und Parametern
 */
export const createFilterConditions = (filters, mappings = {}) => {
  const conditions = [];
  const params = [];
  let paramCounter = 1;
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== '') {
      const dbField = mappings[key] || key;
      
      if (typeof value === 'string' && value.includes('%')) {
        // LIKE-Abfrage
        conditions.push(`${dbField} ILIKE $${paramCounter++}`);
        params.push(value);
      } else {
        // Exakte Übereinstimmung
        conditions.push(`${dbField} = $${paramCounter++}`);
        params.push(value);
      }
    }
  });
  
  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

/**
 * Bereinigt und validiert Eingabedaten
 * @param {object} data - Rohdaten vom Benutzer
 * @param {object} schema - Validierungsschema
 * @returns {object} - Bereinigte Daten oder leeres Objekt bei Fehlern
 */
export const sanitizeAndValidate = (data, schema = {}) => {
  const sanitized = {};
  const errors = {};
  
  Object.entries(schema).forEach(([field, rules]) => {
    let value = data[field];
    
    // Trimmen von Strings
    if (typeof value === 'string') {
      value = value.trim();
    }
    
    // Null-Werte behandeln
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} ist ein Pflichtfeld`;
      return;
    }
    
    // Typ-Konvertierung
    if (rules.type === 'number' && value !== '' && value !== undefined) {
      value = Number(value);
      if (isNaN(value)) {
        errors[field] = `${field} muss eine Zahl sein`;
        return;
      }
    }
    
    // Wert speichern
    sanitized[field] = value;
  });
  
  return { sanitized, errors, isValid: Object.keys(errors).length === 0 };
};