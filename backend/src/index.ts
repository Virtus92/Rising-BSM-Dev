import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import config from './config/index.js';
import { bootstrap } from './core/Bootstrapper.js';
import { setupMiddleware } from './core/middleware.js';
import { ILoggingService } from './interfaces/ILoggingService.js';
import { SwaggerConfig } from './config/SwaggerConfig.js';

async function main() {
  // Erstelle Express-App
  const app = express();
  
  // Initialisiere alle Dienste über den Bootstrapper
  const container = bootstrap();
  
  // Hole wichtige Dienste aus dem Container
  const logger = container.resolve<ILoggingService>('LoggingService');
  const routesConfig = container.resolve<any>('RoutesConfig');
  const swaggerConfig = container.resolve<any>('SwaggerConfig');
  const errorMiddleware = container.resolve<any>('ErrorMiddleware');
  
  // Richte Middleware ein
  setupMiddleware(app, container);
  
  // Registriere Routen
  routesConfig.registerRoutes(app);
  
  // Richte Swagger ein
  swaggerConfig.setup(app);
  
  // Fehlerbehandlung als letztes Middleware
  errorMiddleware.register(app);

  // Starte Server
  const port = config.PORT;
  app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
  });
  
  return app;
}

// Starte die Anwendung
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Application failed to start:', err);
    process.exit(1);
  });
}

export default main;