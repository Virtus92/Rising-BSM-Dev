/**
 * SwaggerDiagnostic
 * 
 * A utility to diagnose and fix Swagger UI issues.
 */
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import config from '../config/index.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __root = path.resolve(__dirname, '../..');

/**
 * Diagnostic results interface
 */
interface DiagnosticResults {
  swaggerConfigured: boolean;
  corsConfigured: boolean;
  specAvailable: boolean;
  apiReachable: boolean;
  issues: string[];
  recommendations: string[];
}

export class SwaggerDiagnostic {
  /**
   * Creates a new SwaggerDiagnostic instance
   * 
   * @param logger - Logging service
   */
  constructor(private readonly logger: ILoggingService) {
    this.logger.debug('Initialized SwaggerDiagnostic');
  }

  /**
   * Run all diagnostics
   * 
   * @returns Diagnostic results
   */
  public async runDiagnostics(): Promise<DiagnosticResults> {
    this.logger.info('Starting Swagger UI diagnostics');
    
    const results: DiagnosticResults = {
      swaggerConfigured: false,
      corsConfigured: false,
      specAvailable: false,
      apiReachable: false,
      issues: [],
      recommendations: []
    };
    
    // Check if Swagger is enabled in configuration
    results.swaggerConfigured = process.env.SWAGGER_ENABLED !== 'false';
    if (!results.swaggerConfigured) {
      results.issues.push('Swagger UI is disabled in configuration');
      results.recommendations.push('Set SWAGGER_ENABLED=true in your environment variables');
    }
    
    // Check if CORS is properly configured
    results.corsConfigured = this.checkCorsConfiguration(results);
    
    // Check if OpenAPI spec is available
    results.specAvailable = await this.checkSpecAvailability(results);
    
    // Check if API is reachable
    results.apiReachable = await this.checkApiReachability(results);
    
    // Generate final recommendations
    this.generateRecommendations(results);
    
    this.logger.info('Swagger UI diagnostics complete', { results });
    return results;
  }

  /**
   * Check CORS configuration
   * 
   * @param results - Diagnostic results
   * @returns Whether CORS is configured correctly
   */
  private checkCorsConfiguration(results: DiagnosticResults): boolean {
    // Check if CORS is enabled
    if (!config.CORS_ENABLED) {
      results.issues.push('CORS is disabled which will prevent Swagger UI from making API requests');
      results.recommendations.push('Set CORS_ENABLED=true in your environment variables');
      return false;
    }
    
    // Check if CORS origins include localhost or are properly configured
    const corsOrigins = config.CORS_ORIGINS;
    
    if (corsOrigins.length === 0) {
      results.issues.push('No CORS origins configured');
      results.recommendations.push('Add appropriate origins to CORS_ORIGINS in your environment variables');
      return false;
    }
    
    // For Swagger UI, we need localhost origins or '*'
    const hasLocalhost = corsOrigins.some(origin => 
      origin.includes('localhost') || origin === '*'
    );
    
    if (!hasLocalhost && config.IS_DEVELOPMENT) {
      results.issues.push('CORS origins do not include localhost which may prevent Swagger UI from working');
      results.recommendations.push(`Add 'http://localhost:3000' to CORS_ORIGINS in your environment variables`);
    }
    
    return true;
  }

  /**
   * Check OpenAPI spec availability
   * 
   * @param results - Diagnostic results
   * @returns Whether OpenAPI spec is available
   */
  private async checkSpecAvailability(results: DiagnosticResults): Promise<boolean> {
    // Check for OpenAPI spec file
    const possiblePaths = [
      '/app/dist/swagger.json',
      path.resolve(__root, 'dist/swagger.json'),
      path.resolve(process.cwd(), 'dist/swagger.json'),
      path.resolve(__root, 'openapi/openapi.yaml'),
      path.resolve(process.cwd(), 'openapi/openapi.yaml')
    ];
    
    let specFound = false;
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        specFound = true;
        this.logger.info(`Found OpenAPI spec at: ${filePath}`);
        
        // Check if spec is valid
        try {
          if (filePath.endsWith('.json')) {
            const content = fs.readFileSync(filePath, 'utf8');
            JSON.parse(content); // Will throw if invalid JSON
          } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
            // We already know the file exists, so consider it valid for now
            // A more thorough check would parse the YAML
          }
        } catch (error) {
          specFound = false;
          results.issues.push(`OpenAPI spec at ${filePath} is not valid: ${error instanceof Error ? error.message : String(error)}`);
          results.recommendations.push('Validate your OpenAPI specification using a tool like https://editor.swagger.io/');
        }
        
        break;
      }
    }
    
    // Check if spec is accessible via HTTP
    try {
      const host = config.HOST === '0.0.0.0' ? 'localhost' : config.HOST;
      const port = config.PORT;
      
      const response = await this.httpGet(`http://${host}:${port}/swagger.json`);
      if (response) {
        specFound = true;
        this.logger.info('OpenAPI spec is accessible via HTTP');
      }
    } catch (error) {
      // If we already found a file spec, this is not critical
      if (!specFound) {
        results.issues.push('OpenAPI spec is not accessible via HTTP');
        results.recommendations.push('Ensure /swagger.json endpoint is properly configured');
      }
    }
    
    if (!specFound) {
      results.issues.push('OpenAPI specification not found');
      results.recommendations.push('Create an OpenAPI specification in openapi/openapi.yaml or dist/swagger.json');
    }
    
    return specFound;
  }

  /**
   * Check API reachability
   * 
   * @param results - Diagnostic results
   * @returns Whether API is reachable
   */
  private async checkApiReachability(results: DiagnosticResults): Promise<boolean> {
    // Try to access the API health endpoint
    try {
      const host = config.HOST === '0.0.0.0' ? 'localhost' : config.HOST;
      const port = config.PORT;
      
      this.logger.info(`Checking API reachability at http://${host}:${port}/health`);
      
      const response = await this.httpGet(`http://${host}:${port}/health`);
      if (response) {
        this.logger.info('API is reachable');
        
        // Check if the response is valid
        try {
          const data = JSON.parse(response);
          if (data.status === 'ok') {
            this.logger.info('API health check successful');
            return true;
          } else {
            results.issues.push('API health check failed: Unexpected response');
            results.recommendations.push('Check your health endpoint implementation');
          }
        } catch (error) {
          results.issues.push('API health check returned invalid JSON');
          results.recommendations.push('Ensure health endpoint returns valid JSON with status field');
        }
      }
    } catch (error) {
      results.issues.push(`API is not reachable: ${error instanceof Error ? error.message : String(error)}`);
      results.recommendations.push('Ensure your API server is running and accessible');
      
      // Check if server is running on a different port
      try {
        for (const testPort of [3000, 8000, 8080]) {
          if (testPort === config.PORT) continue;
          
          const host = config.HOST === '0.0.0.0' ? 'localhost' : config.HOST;
          const response = await this.httpGet(`http://${host}:${testPort}/health`);
          
          if (response) {
            results.issues.push(`API appears to be running on port ${testPort} instead of configured port ${config.PORT}`);
            results.recommendations.push(`Update PORT to ${testPort} in your environment variables or configuration`);
            break;
          }
        }
      } catch {
        // No alternative port found
      }
    }
    
    return false;
  }

  /**
   * Generate final recommendations
   * 
   * @param results - Diagnostic results
   */
  private generateRecommendations(results: DiagnosticResults): void {
    // Add common recommendations based on issues found
    if (results.issues.length > 0) {
      // If Swagger UI is not working at all
      if (!results.swaggerConfigured && !results.corsConfigured && !results.specAvailable && !results.apiReachable) {
        results.recommendations.push('Complete setup of Swagger UI following the implementation guide');
      }
      
      // If only some components are working
      if (results.apiReachable && !results.corsConfigured) {
        results.recommendations.push('API is reachable but CORS is not configured correctly. Update CORS settings in your environment variables.');
      }
      
      if (results.specAvailable && !results.apiReachable) {
        results.recommendations.push('OpenAPI spec is available but API is not reachable. Check API server is running on the correct port.');
      }
      
      // Environment-specific recommendations
      if (config.IS_DEVELOPMENT) {
        results.recommendations.push('In development mode, consider using "*" for CORS_ORIGINS temporarily to troubleshoot issues.');
      } else if (config.IS_PRODUCTION) {
        results.recommendations.push('In production, ensure security settings are properly configured while still allowing Swagger UI to function.');
      }
    } else {
      results.recommendations.push('All diagnostics passed. Swagger UI should be working correctly.');
    }
  }

  /**
   * Fix common Swagger UI issues
   * 
   * @returns Whether fixes were applied successfully
   */
  public async fixCommonIssues(): Promise<boolean> {
    this.logger.info('Attempting to fix common Swagger UI issues');
    
    let fixesApplied = false;
    
    // Run diagnostics first
    const results = await this.runDiagnostics();
    
    // Fix 1: Create dist directory if it doesn't exist
    const distDir = path.resolve(__root, 'dist');
    if (!fs.existsSync(distDir)) {
      try {
        fs.mkdirSync(distDir, { recursive: true });
        this.logger.info(`Created dist directory at ${distDir}`);
        fixesApplied = true;
      } catch (error) {
        this.logger.error(`Failed to create dist directory: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fix 2: Create a simple swagger.json if none exists
    const swaggerJsonPath = path.resolve(distDir, 'swagger.json');
    if (!fs.existsSync(swaggerJsonPath) && !results.specAvailable) {
      try {
        const simpleSpec = this.createSimpleOpenApiSpec();
        fs.writeFileSync(swaggerJsonPath, JSON.stringify(simpleSpec, null, 2), 'utf8');
        this.logger.info(`Created simple OpenAPI spec at ${swaggerJsonPath}`);
        fixesApplied = true;
      } catch (error) {
        this.logger.error(`Failed to create OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Fix 3: Create a Swagger UI custom JS file
    const swaggerCustomJsPath = path.resolve(distDir, 'swagger-custom.js');
    try {
      const customJs = `
        // Fix for CORS and network issues in Swagger UI
        (function() {
          console.log('Swagger UI custom script loaded');
          
          // Override fetch with improved error handling
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            console.log('Fetch request:', url, options);
            
            // Add proper headers to avoid CORS issues
            if (!options) options = {};
            if (!options.headers) options.headers = {};
            options.headers['Accept'] = 'application/json';
            
            // For API requests, add Content-Type
            if (url.toString().includes('/api/')) {
              options.headers['Content-Type'] = 'application/json';
            }
            
            // Use proper mode
            options.mode = 'cors';
            options.credentials = 'include';
            
            return originalFetch(url, options)
              .then(response => {
                if (!response.ok) {
                  console.error('Fetch error:', response.status, response.statusText);
                }
                return response;
              })
              .catch(error => {
                console.error('Fetch error:', error);
                throw error;
              });
          };
        })();
      `;
      
      fs.writeFileSync(swaggerCustomJsPath, customJs, 'utf8');
      this.logger.info(`Created Swagger UI custom JS file at ${swaggerCustomJsPath}`);
      fixesApplied = true;
    } catch (error) {
      this.logger.error(`Failed to create Swagger UI custom JS: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Fix 4: Create a CORS diagnostic endpoint
    this.logger.info('A CORS diagnostic endpoint should be created manually in the application');
    
    return fixesApplied;
  }
  
  /**
   * Create a simple OpenAPI specification
   */
  private createSimpleOpenApiSpec(): any {
    const host = config.HOST === '0.0.0.0' ? 'localhost' : config.HOST;
    const port = config.PORT;
    const apiPrefix = config.API_PREFIX;
    
    return {
      openapi: "3.0.0",
      info: {
        title: "API Documentation",
        version: "1.0.0",
        description: "API documentation for the backend services"
      },
      servers: [
        {
          url: `http://${host}:${port}${apiPrefix}`,
          description: "Development server"
        }
      ],
      paths: {
        "/health": {
          get: {
            summary: "Health check endpoint",
            description: "Check if the API is running",
            responses: {
              "200": {
                description: "API is operational",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        status: {
                          type: "string",
                          example: "ok"
                        },
                        timestamp: {
                          type: "string",
                          format: "date-time"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/cors-debug": {
          get: {
            summary: "CORS debug endpoint",
            description: "Get CORS debugging information",
            responses: {
              "200": {
                description: "CORS debugging information",
                content: {
                  "application/json": {
                    schema: {
                      type: "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Helper method for HTTP requests
   * 
   * @param url - URL to request
   * @returns Response body
   */
  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP request failed with status: ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
}

export default SwaggerDiagnostic;