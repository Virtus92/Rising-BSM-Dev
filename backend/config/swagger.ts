import { Application } from 'express';
import { setupSwagger } from './swagger-loader.js';

/**
 * Setup Swagger documentation for Express application
 */
export function initSwaggerDocs(app: Application): void {
  // Check if Swagger is enabled
  const isSwaggerEnabled = process.env.SWAGGER_ENABLED !== 'false'; // Enabled by default
  
  if (!isSwaggerEnabled) {
    console.log('⏭️ Swagger documentation disabled');
    return;
  }
  
  // Setup Swagger UI with our YAML-based OpenAPI spec
  setupSwagger(app, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 0,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      filter: true,
      syntaxHighlight: {
        theme: 'monokai'
      }
    }
  });
}

export default { initSwaggerDocs };