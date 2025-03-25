/**
 * Main Entry Point
 * 
 * Bootstraps the application and starts the server.
 */
import dotenv from 'dotenv';
// Initialize environment variables before anything else
dotenv.config();

import { bootstrap } from './core/Bootstrapper.js';
import { DiContainer } from './core/DiContainer.js';
import initializeApp  from './Application.js';
import { ILoggingService } from './interfaces/ILoggingService.js';

async function main() {
  try {
    // Bootstrap the application
    const container = bootstrap();
    
    // Get logger
    const logger = container.resolve<ILoggingService>('LoggingService');
    logger.info('Starting application...');
    
    // Create and start application
    await initializeApp();
    
    logger.info('Application started successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Run the application
main();