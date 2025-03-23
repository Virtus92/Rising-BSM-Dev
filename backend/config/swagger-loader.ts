import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

// Get the directory name equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug flag can be enabled with environment variable
const DEBUG = process.env.DEBUG_SWAGGER === 'true';

/**
 * Try to find the correct path to the OpenAPI files
 * Useful when running in Docker or different environments
 */
function findOpenApiPath(rootDir: string = 'backend/openapi'): string {
  // Possible locations for the OpenAPI files
  const possiblePaths = [
    rootDir,                           // Default
    path.join(process.cwd(), rootDir), // From current working dir
    path.join(process.cwd(), 'backend', 'openapi'), // Backend specific
    path.join(process.cwd(), 'openapi'), // Root openapi folder
    path.join(__dirname, '..', 'openapi'), // Relative to this file
    path.join(__dirname, '..', '..', 'openapi'), // Two levels up
    '/app/openapi', // Docker common path
    '/app/backend/openapi', // Docker backend path
  ];

  // Try each path until we find one with the main OpenAPI file
  for (const pathToTry of possiblePaths) {
    const fullPath = path.join(pathToTry, 'openapi.yaml');
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Found OpenAPI spec at: ${fullPath}`);
      return pathToTry;
    }
  }

  // If we can't find the OpenAPI files, log a more detailed warning
  console.warn(`⚠️ Could not find OpenAPI spec in any of the following locations:`);
  possiblePaths.forEach(p => console.warn(`  - ${p}`));
  console.warn('Using mock data instead. This will limit your API documentation.');
  return '';
}

/**
 * Create a basic OpenAPI specification when no files are found
 */
function createMockOpenApiSpec(): any {
  return {
    openapi: "3.0.0",
    info: {
      title: "Rising BSM API",
      version: "1.0.0",
      description: "Backend API for Rising Business Service Management.\n\nPlease note: The full OpenAPI specification could not be loaded. This is a simplified version."
    },
    servers: [
      {
        url: "/api/v1",
        description: "Local API server"
      }
    ],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          description: "Check if the API is running",
          responses: {
            "200": {
              description: "API is running",
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
      }
    }
  };
}

/**
 * Load and resolve OpenAPI spec from YAML files
 */
export function loadOpenApiSpec(rootDir: string = 'backend/openapi'): any {
  // Find the correct path to the OpenAPI files
  const openapiPath = findOpenApiPath(rootDir);
  
  // If we couldn't find the OpenAPI files, return a mock spec
  if (!openapiPath) {
    console.log(`ℹ️ Using mock OpenAPI spec`);
    return createMockOpenApiSpec();
  }
  
  try {
    // Read and parse main OpenAPI file
    const mainSpecPath = path.join(openapiPath, 'openapi.yaml');
    let mainSpecYaml;
    
    try {
      mainSpecYaml = fs.readFileSync(mainSpecPath, 'utf8');
    } catch (error) {
      console.error(`Error reading main OpenAPI file: ${mainSpecPath}`, error);
      return createMockOpenApiSpec();
    }
    
    let mainSpec;
    try {
      mainSpec = yaml.load(mainSpecYaml) as any;
      if (DEBUG) console.log('Successfully parsed main OpenAPI YAML');
    } catch (yamlError: any) {
      console.error('⚠️ YAML parsing error in main OpenAPI file:');
      console.error(`   ${(yamlError as Error).message}`);
      console.error(`   at line ${yamlError.mark?.line + 1}, column ${yamlError.mark?.column + 1}`);
      console.error('This will cause issues with your API documentation.');
      return createMockOpenApiSpec();
    }
    
    // Track loaded files to avoid circular references
    const loadedFiles = new Set<string>();
    loadedFiles.add(mainSpecPath);
    
    // Resolve references in spec
    const resolvedSpec = resolveReferences(mainSpec, openapiPath, loadedFiles);
    
    // Validate the number of paths to ensure everything loaded correctly
    const pathCount = Object.keys(resolvedSpec.paths || {}).length;
    if (pathCount === 0) {
      console.warn('⚠️ No paths found in the OpenAPI specification after resolving references.');
      console.warn('   This might indicate problems with your reference paths or YAML syntax.');
    } else {
      if (DEBUG) console.log(`Found ${pathCount} API paths in the specification`);
    }
    
    return resolvedSpec;
  } catch (error) {
    console.error('Error processing OpenAPI spec:', error);
    return createMockOpenApiSpec();
  }
}

/**
 * Recursively resolve references in OpenAPI spec
 */
function resolveReferences(obj: any, rootDir: string, loadedFiles: Set<string>): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // If it's an array, resolve references in each item
  if (Array.isArray(obj)) {
    return obj.map(item => resolveReferences(item, rootDir, loadedFiles));
  }
  
  // Create a new object to avoid modifying the original
  const result: any = {};
  
  // Process each property
  for (const [key, value] of Object.entries(obj)) {
    // Check for $ref property
    if (key === '$ref' && typeof value === 'string' && value.startsWith('./')) {
      // Parse reference path
      const refPath = value.substring(2); // Remove './'
      const [filePath, refPointer] = refPath.split('#/');
      
      // Resolve file path
      const fullPath = path.join(rootDir, filePath);
      
      try {
        // Load referenced file if not already loaded
        if (!loadedFiles.has(fullPath)) {
          if (!fs.existsSync(fullPath)) {
            console.error(`⚠️ Referenced file does not exist: ${fullPath}`);
            result[key] = value; // Keep the unresolved reference
            continue;
          }
          
          loadedFiles.add(fullPath);
          const refFileYaml = fs.readFileSync(fullPath, 'utf8');
          
          let refObj;
          try {
            refObj = yaml.load(refFileYaml) as any;
          } catch (yamlError: any) {
            console.error(`⚠️ YAML parsing error in referenced file: ${fullPath}`);
            console.error(`   ${(yamlError as Error).message}`);
            console.error(`   at line ${yamlError.mark?.line + 1}, column ${yamlError.mark?.column + 1}`);
            result[key] = value; // Keep the unresolved reference
            continue;
          }
          
          // Get referenced object using pointer
          let referencedObj = refObj;
          if (refPointer) {
            const parts = refPointer.split('/');
            for (const part of parts) {
              if (part && referencedObj) {
                if (!(part in referencedObj)) {
                  console.error(`⚠️ Reference pointer "${refPointer}" not found in ${filePath}`);
                  console.error(`   Missing part: ${part}`);
                  result[key] = value; // Keep the unresolved reference
                  continue;
                }
                referencedObj = referencedObj[part];
              }
            }
          }
          
          // Check if we actually found the referenced object
          if (referencedObj === undefined) {
            console.error(`⚠️ Reference resolved to undefined: ${value}`);
            result[key] = value; // Keep the unresolved reference
            continue;
          }
          
          // Resolve any nested references
          return resolveReferences(referencedObj, rootDir, loadedFiles);
        }
      } catch (error) {
        console.error(`Error resolving reference to ${fullPath}:`, error);
        // Return the unresolved reference if there's an error
        result[key] = value;
      }
    } else {
      // Recursively resolve references in nested objects
      result[key] = resolveReferences(value, rootDir, loadedFiles);
    }
  }
  
  return result;
}

/**
 * Setup Swagger UI middleware
 */
export function setupSwagger(app: any, options: any = {}): void {
  // Check if Swagger is enabled (default to enabled)
  const isSwaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
  
  // Skip setup if Swagger is disabled
  if (!isSwaggerEnabled) {
    console.log('⏭️ Swagger documentation disabled');
    return;
  }
  
  // Load OpenAPI spec (will return mock data if files not found)
  const openApiSpec = loadOpenApiSpec();
  
  // Validate the loaded spec
  validateOpenApiSpec(openApiSpec);
  
  // Default Swagger UI options
  const defaultOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
    }
  };
  
  // Merge options
  const uiOptions = { ...defaultOptions, ...options };
  
  try {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(openApiSpec, uiOptions));
    
    // Serve Swagger specification as JSON
    app.get('/swagger.json', (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(openApiSpec);
    });
    
    // Development token endpoint (for testing in non-production environments)
    if (process.env.NODE_ENV !== 'production') {
      app.get('/api-docs/dev-token', (_req: any, res: any) => {
        try {
          const jwt = require('jsonwebtoken');
          const token = jwt.sign(
            { userId: 1, role: 'admin', name: 'Developer' },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '1h' }
          );
          
          res.json({
            token,
            instructions: 'Click the Authorize button and enter this token with the "Bearer " prefix'
          });
        } catch (error) {
          console.error('Error generating token:', error);
          res.status(500).json({ error: 'Failed to generate token' });
        }
      });
      
      // Create a helper HTML page for API testing
      app.get('/api-docs/helper', (_req: any, res: any) => {
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { userId: 1, role: 'admin', name: 'Developer' },
          process.env.JWT_SECRET || 'dev-secret',
          { expiresIn: '1h' }
        );
        
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>API Testing Helper</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
                button { background-color: #4CAF50; color: white; border: none; padding: 8px 16px; 
                        border-radius: 4px; cursor: pointer; }
                button:hover { background-color: #45a049; }
              </style>
            </head>
            <body>
              <h1>API Testing Helper</h1>
              
              <div class="card">
                <h2>Bearer Token</h2>
                <p>Use this token for testing authenticated API endpoints:</p>
                <pre id="token">${token}</pre>
                <button onclick="copyToken()">Copy Token</button>
              </div>
              
              <div class="card">
                <h2>Instructions</h2>
                <ol>
                  <li>Copy the token above</li>
                  <li>Go to <a href="/api-docs">Swagger UI</a></li>
                  <li>Click the "Authorize" button</li>
                  <li>Enter "Bearer " followed by the token</li>
                  <li>Click "Authorize" and close the dialog</li>
                  <li>Now you can test authenticated endpoints</li>
                </ol>
              </div>
              
              <script>
                function copyToken() {
                  const token = document.getElementById('token').textContent;
                  navigator.clipboard.writeText(token)
                    .then(() => alert('Token copied to clipboard!'))
                    .catch(err => console.error('Failed to copy: ', err));
                }
              </script>
            </body>
          </html>
        `;
        
        res.send(html);
      });
    }
    
    console.log(`✅ Swagger documentation available at /api-docs`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`💡 API testing helper available at /api-docs/helper`);
    }
  } catch (error) {
    console.error('Error setting up Swagger UI:', error);
    console.log('👉 Swagger UI setup was skipped due to errors');
  }
}

/**
 * Validate the OpenAPI specification
 * @param spec OpenAPI specification object
 * @returns true if valid, false if invalid
 */
function validateOpenApiSpec(spec: any): boolean {
  if (!spec) {
    console.error('❌ OpenAPI specification is null or undefined');
    return false;
  }
  
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    console.warn('⚠️ OpenAPI specification has no paths defined');
    return false;
  }
  
  // Check if the specification has the required fields
  if (!spec.openapi) {
    console.warn('⚠️ OpenAPI specification is missing the "openapi" field');
  }
  
  if (!spec.info) {
    console.warn('⚠️ OpenAPI specification is missing the "info" field');
  } else {
    if (!spec.info.title) {
      console.warn('⚠️ OpenAPI specification is missing the "info.title" field');
    }
    
    if (!spec.info.version) {
      console.warn('⚠️ OpenAPI specification is missing the "info.version" field');
    }
  }
  
  if (!spec.servers || spec.servers.length === 0) {
    console.warn('⚠️ OpenAPI specification has no servers defined');
  }
  
  // Count the number of defined paths and operations
  let operationCount = 0;
  for (const [_path, pathObj] of Object.entries(spec.paths || {})) {
    for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']) {
      if ((pathObj as any)[method]) {
        operationCount++;
      }
    }
  }
  
  if (DEBUG) {
    console.log(`OpenAPI specification contains:`);
    console.log(`- ${Object.keys(spec.paths || {}).length} paths`);
    console.log(`- ${operationCount} operations`);
  }
  
  return true;
}

export default setupSwagger;