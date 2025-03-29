import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import config from './config/index.js';
import { bootstrap } from './core/Bootstrapper.js';
import { setupMiddleware } from './core/middleware.js';
import { ILoggingService } from './interfaces/ILoggingService.js';
import { validateSecurityConfig } from './config/security.js';

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
  
  // Validiere Sicherheitskonfiguration
  validateSecurityConfig(logger);

  // Richte Middleware ein
  setupMiddleware(app, container);
  
  // Registriere Routen
  routesConfig.registerRoutes(app);
  
  // Richte Swagger ein
  swaggerConfig.setupSwagger(app);
  
  // Fehlerbehandlung als letztes Middleware
  errorMiddleware.register(app);

  app.use(express.static('dist', {
    setHeaders: (res, path) => {
      if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
  // Server erstellen, aber noch nicht starten
  const server = http.createServer(app);
  
  // Starte Server nur, wenn nicht im Testmodus
  if (process.env.NODE_ENV !== 'test') {
    const port = config.PORT;
    server.listen(port, () => {
      logger.info(`Server running at http://localhost:${port}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } else {
    logger.info(`App initialized in test mode - not starting server`);
  }
  
  // Sowohl app als auch server zurückgeben (für Tests wichtig)
  return { app, server };
}

// Starte die Anwendung
// Check if this file is being run directly
const isMainModule = () => {
  try {
    // Avoid using import.meta syntax due to TypeScript configuration
    // For ESM, we need a different approach to determine if this is the main module
    const isDirectlyRun = process.argv.length > 1 && 
      process.argv[1].endsWith('index.js') || 
      process.argv[1].endsWith('index.ts');
    return isDirectlyRun;
  } catch (e) {
    return false;
  }
};

if (isMainModule()) {
  main().catch(err => {
    console.error('Application failed to start:', err);
    process.exit(1);
  });
}

export default main;