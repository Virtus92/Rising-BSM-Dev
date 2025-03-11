/**
 * Helper utilities
 * Common utility functions used across the application
 */
const cache = require('../services/cache.service');
const db = require('../services/db.service');

/**
 * Get status info for different entity types
 */

/**
 * Get status information for a request
 * @param {string} status - Status code
 * @returns {object} - Status label and class name
 */
exports.getAnfrageStatusInfo = (status) => {
  const statusMap = {
    'neu': { label: 'Neu', className: 'warning' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
    'beantwortet': { label: 'Beantwortet', className: 'success' },
    'geschlossen': { label: 'Geschlossen', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for an appointment
 * @param {string} status - Status code
 * @returns {object} - Status label and class name
 */
exports.getTerminStatusInfo = (status) => {
  const statusMap = {
    'geplant': { label: 'Geplant', className: 'warning' },
    'bestaetigt': { label: 'Bestätigt', className: 'success' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'primary' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for a project
 * @param {string} status - Status code
 * @returns {object} - Status label and class name
 */
exports.getProjektStatusInfo = (status) => {
  const statusMap = {
    'neu': { label: 'Neu', className: 'info' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'primary' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Generate unique ID
 * @param {number} length - Length of ID
 * @returns {string} - Random ID
 */
exports.generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
};

/**
 * Get notifications for current user
 * @param {object} req - Express request object
 * @returns {object} - Notifications with unread count
 */
exports.getNotifications = async (req) => {
  if (!req.session || !req.session.user) {
    return { items: [], unreadCount: 0, totalCount: 0 };
  }
  
  try {
    const userId = req.session.user.id;
    const cacheKey = `notifications_${userId}`;
    
    // Try to get from cache first
    return await cache.getOrExecute(cacheKey, async () => {
      // Get notifications from database
      const notificationsQuery = await db.query(`
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
      `, [userId]);
      
      // Get unread count
      const unreadCountQuery = await db.query(`
        SELECT COUNT(*) FROM benachrichtigungen 
        WHERE benutzer_id = $1 AND gelesen = false
      `, [userId]);
      
      // Get total count
      const totalCountQuery = await db.query(`
        SELECT COUNT(*) FROM benachrichtigungen 
        WHERE benutzer_id = $1
      `, [userId]);
      
      // Format notifications
      const items = notificationsQuery.rows.map(n => {
        const { formatRelativeTime } = require('./formatters');
        
        return {
          id: n.id,
          title: n.titel,
          type: n.typ === 'anfrage' ? 'success' : 
                n.typ === 'termin' ? 'primary' : 
                n.typ === 'warnung' ? 'warning' : 'info',
          icon: n.typ === 'anfrage' ? 'envelope' : 
                n.typ === 'termin' ? 'calendar-check' : 
                n.typ === 'warnung' ? 'exclamation-triangle' : 'bell',
          time: formatRelativeTime(n.erstellt_am),
          link: n.typ === 'anfrage' ? `/dashboard/anfragen/${n.referenz_id}` :
                n.typ === 'termin' ? `/dashboard/termine/${n.referenz_id}` :
                n.typ === 'projekt' ? `/dashboard/projekte/${n.referenz_id}` :
                '/dashboard/notifications'
        };
      });
      
      return {
        items,
        unreadCount: parseInt(unreadCountQuery.rows[0].count || 0),
        totalCount: parseInt(totalCountQuery.rows[0].count || 0)
      };
    }, 30); // Cache for 30 seconds
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { items: [], unreadCount: 0, totalCount: 0 };
  }
};

/**
 * Count new requests
 * @returns {Promise<number>} - Count of new requests
 */
exports.getNewRequestsCount = async () => {
  try {
    const cacheKey = 'new_requests_count';
    
    return await cache.getOrExecute(cacheKey, async () => {
      const result = await db.query(`
        SELECT COUNT(*) FROM kontaktanfragen 
        WHERE status = 'neu'
      `);
      
      return parseInt(result.rows[0].count || 0);
    }, 60); // Cache for 1 minute
  } catch (error) {
    console.error('Error counting new requests:', error);
    return 0;
  }
};

/**
 * Parse query filters
 * @param {object} query - Express req.query object
 * @param {object} defaults - Default filter values
 * @returns {object} - Parsed filters
 */
exports.parseFilters = (query, defaults = {}) => {
  const filters = { ...defaults };
  
  // Add pagination
  filters.page = parseInt(query.page) || 1;
  filters.limit = parseInt(query.limit) || 20;
  
  // Add sorting
  if (query.sort) {
    const [field, direction] = query.sort.split(':');
    filters.sort = {
      field: field || 'id',
      direction: (direction || 'asc').toUpperCase()
    };
  }
  
  // Add date range
  if (query.start_date) {
    filters.start_date = new Date(query.start_date);
    
    // Default end_date to today if not provided
    if (!query.end_date) {
      filters.end_date = new Date();
    }
  }
  
  if (query.end_date) {
    filters.end_date = new Date(query.end_date);
  }
  
  // Add search term
  if (query.search) {
    filters.search = query.search.trim();
  }
  
  // Add status
  if (query.status) {
    filters.status = query.status;
  }
  
  // Add type
  if (query.type) {
    filters.type = query.type;
  }
  
  return filters;
};

/**
 * Sanitize a string for use in SQL LIKE clause
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
exports.sanitizeLikeString = (str) => {
  if (!str) return '';
  
  // Escape special characters in LIKE pattern
  return str.replace(/[%_\\]/g, '\\$&');
};

/**
 * Truncate HTML string and close any open tags
 * @param {string} html - HTML string to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated HTML with closed tags
 */
exports.truncateHtml = (html, maxLength) => {
  if (!html || html.length <= maxLength) {
    return html;
  }
  
  // Simple truncation for now
  // A more complex version would properly close HTML tags
  return html.substring(0, maxLength) + '...';
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Property to group by
 * @returns {object} - Grouped object
 */
exports.groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {});
};