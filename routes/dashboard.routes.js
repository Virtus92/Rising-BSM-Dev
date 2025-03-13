/**
 * Dashboard Routes
 * Main router for all dashboard routes
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// Apply authentication middleware to all dashboard routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard
 * @desc    Dashboard home page with stats and overview
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await dashboardController.getDashboardData(req);
    
    res.render('dashboard/index', {
      title: 'Dashboard - Rising BSM',
      user: req.session.user,
      currentPath: '/',
      stats: data.stats,
      chartFilters: data.chartFilters,
      charts: data.charts,
      newRequestsCount: req.newRequestsCount,
      notifications: data.notifications,
      recentRequests: data.recentRequests,
      upcomingAppointments: data.upcomingAppointments,
      systemStatus: data.systemStatus,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /dashboard/search
 * @desc    Global search across all entities
 */
router.get('/search', async (req, res, next) => {
    try {
      const { query } = req.query;
      const results = await dashboardController.globalSearch(query);
      
      // If it's an API request, return JSON
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json(results);
      }
      
      // Otherwise render the search results view
      res.render('dashboard/search', {
        title: `Suchergebnisse: ${query} - Rising BSM`,
        user: req.session.user,
        currentPath: '/dashboard',
        searchQuery: query,
        results: results,
        newRequestsCount: req.newRequestsCount,
        csrfToken: req.csrfToken()
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route   GET /dashboard/notifications
   * @desc    View all notifications
   */
  router.get('/notifications', async (req, res, next) => {
    try {
      const data = await dashboardController.getNotifications(req.session.user.id);
      
      // If it's an API request, return JSON
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json(data);
      }
      
      // Otherwise render the notifications view
      res.render('dashboard/notifications', {
        title: 'Benachrichtigungen - Rising BSM',
        user: req.session.user,
        currentPath: '/dashboard',
        notifications: data.notifications,
        newRequestsCount: req.newRequestsCount,
        csrfToken: req.csrfToken()
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route   POST /dashboard/notifications/mark-read
   * @desc    Mark notification(s) as read
   */
  router.post('/notifications/mark-read', async (req, res, next) => {
    try {
      const { id, all } = req.body;
      const result = await dashboardController.markNotificationsRead(req.session.user.id, id, all);
      
      // Always return JSON for this endpoint
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route   GET /dashboard/stats
   * @desc    API endpoint for dashboard statistics
   */
  router.get('/stats', async (req, res, next) => {
    try {
      const data = await dashboardController.getDashboardStats();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route   GET /dashboard/data
   * @desc    API endpoint for dashboard data
   */
  
  router.get('/api/data', (req, res) => {
    try {
      // Return JSON data for your dashboard
      res.json({
        stats: {
          // Your dashboard stats here
        },
        recentRequests: [],
        upcomingAppointments: []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Error fetching dashboard data' });
    }
  });
  
  /**
   * @route   GET /dashboard/logout
   * @desc    Logout and destroy session
   */
  router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/login');
    });
  });
  
  module.exports = router;