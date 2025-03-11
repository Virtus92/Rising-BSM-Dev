/**
 * Dashboard Middleware
 * Provides common middleware functions for dashboard routes
 */
const pool = require('../services/db.service');
const NotificationService = require('../services/notification.service');

/**
 * Middleware to get new requests count
 * Attaches the count of new contact requests to the request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getNewRequestsCountMiddleware = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) FROM kontaktanfragen 
      WHERE status = 'neu'
    `);
    
    req.newRequestsCount = parseInt(result.rows[0].count || 0);
    next();
  } catch (error) {
    console.error('Error fetching new requests count:', error);
    req.newRequestsCount = 0;
    next();
  }
};

/**
 * Middleware to attach user notifications
 * Retrieves and attaches user notifications to the request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.attachNotificationsMiddleware = async (req, res, next) => {
  try {
    // Only attach notifications if user is authenticated
    if (req.session && req.session.user) {
      const notifications = await NotificationService.getNotifications(
        req.session.user.id, 
        { limit: 5, unreadOnly: true }
      );
      
      req.notifications = notifications.notifications;
      req.unreadNotificationsCount = notifications.unreadCount;
    } else {
      req.notifications = [];
      req.unreadNotificationsCount = 0;
    }
    
    next();
  } catch (error) {
    console.error('Error attaching notifications:', error);
    req.notifications = [];
    req.unreadNotificationsCount = 0;
    next();
  }
};

/**
 * Middleware to log user activity
 * Logs route access and potentially other user interactions
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.logUserActivityMiddleware = async (req, res, next) => {
  try {
    // Only log for authenticated users
    if (req.session && req.session.user) {
      await pool.query({
        text: `
          INSERT INTO benutzer_aktivitaet (
            benutzer_id, 
            aktivitaet, 
            route, 
            ip_adresse
          ) VALUES ($1, $2, $3, $4)
        `,
        values: [
          req.session.user.id,
          'route_access',
          req.path,
          req.ip
        ]
      });
    }
    
    next();
  } catch (error) {
    console.error('Error logging user activity:', error);
    next();
  }
};

/**
 * Middleware to prepare dashboard context
 * Combines multiple dashboard-related data preparation steps
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.prepareDashboardContextMiddleware = [
  this.getNewRequestsCountMiddleware,
  this.attachNotificationsMiddleware,
  this.logUserActivityMiddleware
];