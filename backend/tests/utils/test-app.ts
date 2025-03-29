/**
 * Test Application Factory
 * 
 * This module creates an Express application for testing purposes.
 * It's a simplified version of the main application entry point.
 */
import express from 'express';
import { bootstrap } from '../../src/core/Bootstrapper.js';

/**
 * Creates a test Express application
 * @returns Express app and server for testing
 */
async function createTestApp() {
  try {
    console.log('✨ Creating test app...');
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    // Create Express application
    const app = express();
    
    // Bootstrap application
    const container = bootstrap();
    
    // Get essential services
    const logger = container.resolve('LoggingService');
    const errorMiddleware = container.resolve('ErrorMiddleware');
    
    // Set up static file serving (simplified for tests)
    app.use(express.static('dist'));
    
    // Set up error handling
    app.use((err: any, req: any, res: any, next: any) => {
      errorMiddleware.handleError(err, req, res, next);
    });
    
    // Create a test HTTP server
    const server = require('http').createServer(app);
    
    console.log('✅ Test app ready');
    
    return { 
      app, 
      server,
      container
    };
  } catch (error) {
    console.error('❌ Failed to create test app:', error);
    throw error;
  }
}

export default createTestApp;
