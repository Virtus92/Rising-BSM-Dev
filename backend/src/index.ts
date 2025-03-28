import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
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

  // Starte Server nur, wenn nicht im Testmodus
  if (process.env.NODE_ENV !== 'test') {
    const port = config.PORT;
    app.listen(port, () => {
      logger.info(`Server running at http://localhost:${port}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } else {
    logger.info(`App initialized in test mode - not starting server`);
  }
  
  return app;
}

// Starte die Anwendung
// Check if this file is being run directly
const isMainModule = () => {
  try {
    return import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
  } catch (e) {
    // Fallback for environments where import.meta might not be available
    return require.main === module;
  }
};

if (isMainModule()) {
  main().catch(err => {
    console.error('Application failed to start:', err);
    process.exit(1);
  });
}

export default main;