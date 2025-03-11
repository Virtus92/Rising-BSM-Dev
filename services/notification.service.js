/**
 * Notification Service
 * Manages notification creation, sending, and tracking
 */
const pool = require('./db.service');
const { formatRelativeTime } = require('../utils/formatters');

class NotificationService {
  /**
   * Create a new notification
   * @param {object} options - Notification details
   * @returns {Promise<object>} - Created notification
   */
  static async create(options) {
    const {
      userId,
      type,
      title,
      message,
      referenceId = null,
      referenceType = null
    } = options;

    try {
      const result = await pool.query({
        text: `
          INSERT INTO benachrichtigungen (
            benutzer_id, 
            typ, 
            titel, 
            nachricht, 
            referenz_id, 
            referenz_typ
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        values: [
          userId, 
          type, 
          title, 
          message, 
          referenceId, 
          referenceType
        ]
      });

      return {
        id: result.rows[0].id,
        success: true
      };
    } catch (error) {
      console.error('Notification creation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notifications for a user
   * @param {number} userId - User ID
   * @param {object} options - Filtering and pagination options
   * @returns {Promise<object>} - Notifications and metadata
   */
  static async getNotifications(userId, options = {}) {
    const {
      limit = 10,
      offset = 0,
      unreadOnly = false,
      type = null
    } = options;

    try {
      // Build dynamic WHERE clause
      const whereClauses = [`benutzer_id = $1`];
      const params = [userId];
      let paramCounter = 2;

      if (unreadOnly) {
        whereClauses.push(`gelesen = false`);
      }

      if (type) {
        whereClauses.push(`typ = $${paramCounter++}`);
        params.push(type);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Fetch notifications
      const notificationsQuery = await pool.query({
        text: `
          SELECT 
            id, 
            typ, 
            titel, 
            nachricht, 
            referenz_id, 
            referenz_typ,
            erstellt_am,
            gelesen
          FROM benachrichtigungen
          ${whereClause}
          ORDER BY erstellt_am DESC
          LIMIT $${paramCounter++} OFFSET $${paramCounter++}
        `,
        values: [...params, limit, offset]
      });

      // Count total and unread notifications
      const countsQuery = await pool.query({
        text: `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN gelesen = false THEN 1 END) as unread
          FROM benachrichtigungen
          ${whereClause}
        `,
        values: params
      });

      // Format notifications
      const notifications = notificationsQuery.rows.map(n => ({
        id: n.id,
        type: this.mapNotificationType(n.typ),
        title: n.titel,
        message: n.nachricht,
        referenceId: n.referenz_id,
        referenceType: n.referenz_typ,
        timestamp: formatRelativeTime(n.erstellt_am),
        isRead: n.gelesen,
        link: this.generateNotificationLink(n)
      }));

      return {
        notifications,
        total: parseInt(countsQuery.rows[0].total),
        unreadCount: parseInt(countsQuery.rows[0].unread)
      };
    } catch (error) {
      console.error('Notification retrieval error:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   * @param {number} userId - User ID
   * @param {number|array} notificationIds - Notification ID(s)
   * @returns {Promise<object>} - Update result
   */
  static async markAsRead(userId, notificationIds) {
    try {
      // Normalize to array
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

      const result = await pool.query({
        text: `
          UPDATE benachrichtigungen 
          SET gelesen = true, updated_at = CURRENT_TIMESTAMP
          WHERE benutzer_id = $1 
          AND id = ANY($2)
        `,
        values: [userId, ids]
      });

      return {
        success: true,
        updatedCount: result.rowCount
      };
    } catch (error) {
      console.error('Notification mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map notification type to user-friendly representation
   * @param {string} type - Notification type
   * @returns {object} - Mapped notification type
   */
  static mapNotificationType(type) {
    const typeMap = {
      'anfrage': { 
        key: 'request', 
        label: 'Anfrage', 
        icon: 'envelope', 
        color: 'info' 
      },
      'termin': { 
        key: 'appointment', 
        label: 'Termin', 
        icon: 'calendar', 
        color: 'primary' 
      },
      'projekt': { 
        key: 'project', 
        label: 'Projekt', 
        icon: 'briefcase', 
        color: 'success' 
      },
      'system': { 
        key: 'system', 
        label: 'System', 
        icon: 'bell', 
        color: 'warning' 
      }
    };

    return typeMap[type] || { 
      key: 'default', 
      label: 'Benachrichtigung', 
      icon: 'info-circle', 
      color: 'secondary' 
    };
  }

  /**
   * Generate notification link based on type
   * @param {object} notification - Notification object
   * @returns {string} - Notification link
   */
  static generateNotificationLink(notification) {
    switch (notification.typ) {
      case 'anfrage':
        return `/dashboard/anfragen/${notification.referenz_id}`;
      case 'termin':
        return `/dashboard/termine/${notification.referenz_id}`;
      case 'projekt':
        return `/dashboard/projekte/${notification.referenz_id}`;
      default:
        return '/dashboard/notifications';
    }
  }
}

module.exports = NotificationService;