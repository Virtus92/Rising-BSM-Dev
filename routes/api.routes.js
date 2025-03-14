/**
 * API Routes
 * Central file for all API route registration
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../services/db.service');

// Import all route modules
const customerRoutes = require('./customer.routes');
const projectRoutes = require('./project.routes');
const appointmentRoutes = require('./appointment.routes');
const serviceRoutes = require('./service.routes');
const requestRoutes = require('./request.routes');
const profileRoutes = require('./profile.routes');
const settingsRoutes = require('./settings.routes');
const dashboardRoutes = require('./dashboard.routes');

// Register all API routes
router.use('/customers', customerRoutes);
router.use('/projects', projectRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/services', serviceRoutes);
router.use('/requests', requestRoutes);
router.use('/profile', profileRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);

// CSRF-free contact endpoint (use only during development/testing)
router.post('/contact-direct', async (req, res) => {
  try {
    console.log('Direct contact submission received');
    console.log('Request body:', req.body);
    
    // Basic validation
    const { name, email, service, message } = req.body;
    
    if (!name || !email || !service || !message) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    // Insert into database - using direct pool query instead of ConnectionManager
    const result = await pool.query({
      text: `
        INSERT INTO kontaktanfragen (
          name, 
          email, 
          phone, 
          service, 
          message, 
          status,
          ip_adresse
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id
      `,
      values: [
        name, 
        email, 
        req.body.phone || null, 
        service, 
        message, 
        'neu', 
        req.ip
      ]
    });
    
    const requestId = result.rows[0].id;
    
    return res.status(200).json({
      success: true,
      message: 'Your message has been successfully sent. We will contact you soon.',
      requestId
    });
    
  } catch (error) {
    console.error('Direct contact submission error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
});

module.exports = router;