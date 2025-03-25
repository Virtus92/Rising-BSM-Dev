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
function findOpenApiPath(rootDir: string = 'openapi'): string {
  // Possible locations for the OpenAPI files
  const possiblePaths = [
    rootDir,                           // Default
    path.join(process.cwd(), rootDir), // From current working dir
    path.join(process.cwd(), 'openapi'), // Root openapi folder
    path.join(__dirname, '..', 'openapi'), // Relative to this file
    path.join(__dirname, '..', '..', 'openapi'), // Two levels up
    '/app/openapi', // Docker common path
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
 * Load a YAML file with better error handling
 */
function loadYamlFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (error: any) {
    console.error(`Error loading YAML file ${filePath}:`);
    console.error(`   ${error.message}`);
    if (error.mark) {
      console.error(`   at line ${error.mark.line + 1}, column ${error.mark.column + 1}`);
    }
    throw error;
  }
}

/**
 * Recursively resolve references in OpenAPI spec
 */
function resolveReferences(obj: any, rootDir: string, loadedFiles: Set<string>, currentFile: string = ''): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // If it's an array, resolve references in each item
  if (Array.isArray(obj)) {
    return obj.map(item => resolveReferences(item, rootDir, loadedFiles, currentFile));
  }
  
  // Create a new object to avoid modifying the original
  const result: any = {};
  
  // Process each property
  for (const [key, value] of Object.entries(obj)) {
    // Check for $ref property
    if (key === '$ref' && typeof value === 'string') {
      // Handle local references (within the same file)
      if (value.startsWith('#/')) {
        result[key] = value;
        continue;
      }
      
      try {
        // Parse reference path
        let refPath = value;
        let refPointer = '';
        
        if (value.includes('#/')) {
          const parts = value.split('#/');
          refPath = parts[0];
          refPointer = parts.length > 1 ? parts[1] : '';
        }
        
        // Handle relative paths
        let fullPath = '';
        if (refPath.startsWith('./')) {
          // If we have a current file, resolve relative to it
          if (currentFile) {
            const currentDir = path.dirname(currentFile);
            fullPath = path.join(currentDir, refPath.substring(2));
          } else {
            fullPath = path.join(rootDir, refPath.substring(2));
          }
        } else {
          // Assume it's relative to the root directory
          fullPath = path.join(rootDir, refPath);
        }
        
        // Normalize path to prevent duplicates
        fullPath = path.normalize(fullPath);
        
        // Check if the file exists
        if (!fs.existsSync(fullPath)) {
          console.error(`Referenced file does not exist: ${fullPath}`);
          result[key] = value; // Keep the unresolved reference
          continue;
        }
        
        // Load referenced file if not already loaded
        if (!loadedFiles.has(fullPath)) {
          loadedFiles.add(fullPath);
          
          let refObj;
          try {
            refObj = loadYamlFile(fullPath);
          } catch (error) {
            result[key] = value; // Keep the unresolved reference on error
            continue;
          }
          
          // Get referenced object using pointer
          let referencedObj = refObj;
          if (refPointer) {
            const parts = refPointer.split('/');
            for (const part of parts) {
              if (part && referencedObj) {
                if (!(part in referencedObj)) {
                  console.error(`Reference pointer "${refPointer}" not found in ${refPath}`);
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
            console.error(`Reference resolved to undefined: ${value}`);
            result[key] = value; // Keep the unresolved reference
            continue;
          }
          
          // Resolve any nested references with the current file as the base
          return resolveReferences(referencedObj, rootDir, loadedFiles, fullPath);
        }
      } catch (error) {
        console.error(`Error resolving reference to ${value}:`, error);
        // Return the unresolved reference if there's an error
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively resolve references in nested objects
      result[key] = resolveReferences(value, rootDir, loadedFiles, currentFile);
    } else {
      // Primitive value, copy as is
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Load bundled OpenAPI specification
 */
function loadBundledSpec() {
  try {
    const bundledPath = path.resolve(process.cwd(), 'dist/swagger.json');
    if (fs.existsSync(bundledPath)) {
      console.log('Loading bundled OpenAPI spec from ' + bundledPath);
      return JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading bundled spec:', error);
  }
  return null;
}

/**
 * Load and bundle OpenAPI specification manually
 */
function bundleOpenApiSpec(rootDir: string): any {
  console.log(`Bundling OpenAPI spec from: ${rootDir}`);
  
  // Load main OpenAPI file
  const mainSpecPath = path.join(rootDir, 'openapi.yaml');
  const mainSpec = loadYamlFile(mainSpecPath);
  
  // Create a map to store all path items
  const pathsMap: Record<string, any> = {};
  
  // Process each path reference in the main spec
  for (const [pathKey, pathRef] of Object.entries(mainSpec.paths || {})) {
    if (pathRef && typeof pathRef === 'object' && '$ref' in pathRef) {
      const refString = pathRef.$ref as string;
      
      try {
        // Parse the reference to get file and path
        let refPath = refString;
        let refPointer = '';
        
        if (refString.includes('#/')) {
          const parts = refString.split('#/');
          refPath = parts[0];
          refPointer = parts.length > 1 ? parts[1] : '';
        }
        
        // Load the referenced file
        const fullPath = path.join(rootDir, refPath);
        if (!fs.existsSync(fullPath)) {
          console.error(`Referenced file does not exist: ${fullPath}`);
          continue;
        }
        
        const pathFileContent = loadYamlFile(fullPath);
        
        // Get the referenced path object
        let pathObj = pathFileContent;
        if (refPointer) {
          const parts = refPointer.split('/');
          for (const part of parts) {
            if (part && pathObj) {
              pathObj = pathObj[part];
            }
          }
        }
        
        // Add the path operations to our map
        if (pathObj && typeof pathObj === 'object') {
          pathsMap[pathKey] = pathObj;
          
          if (DEBUG) {
            console.log(`Added path: ${pathKey} from ${refString}`);
            // Count operations
            const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']
              .filter(method => method in pathObj);
            console.log(`  Operations: ${operations.join(', ')}`);
          }
        } else {
          console.error(`Failed to resolve path reference: ${refString}`);
        }
      } catch (error) {
        console.error(`Error processing path reference ${refString}:`, error);
      }
    } else {
      // Direct path definition (not a reference)
      pathsMap[pathKey] = pathRef;
    }
  }
  
  // Create a new spec with resolved paths
  const bundledSpec = {
    ...mainSpec,
    paths: pathsMap
  };
  
  // Count paths and operations
  const pathCount = Object.keys(bundledSpec.paths).length;
  let operationCount = 0;
  
  for (const pathObj of Object.values(bundledSpec.paths)) {
    for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']) {
      if ((pathObj as any)[method]) {
        operationCount++;
      }
    }
  }
  
  console.log(`Successfully bundled OpenAPI spec with ${pathCount} paths and ${operationCount} operations`);
  
  return bundledSpec;
}

/**
 * Load and resolve OpenAPI spec from YAML files
 */
export function loadOpenApiSpec(rootDir: string = 'openapi'): any {
  // Find the correct path to the OpenAPI files
  const openapiPath = findOpenApiPath(rootDir);


  const bundledSpec = loadBundledSpec();
  if (bundledSpec) {
    return bundledSpec;
  }
  
  // If we couldn't find the OpenAPI files, return a mock spec
  if (!openapiPath) {
    console.log(`ℹ️ Using mock OpenAPI spec`);
    return createMockOpenApiSpec();
  }
  
  try {
    // Try the bundling approach first - this is more reliable
    return bundleOpenApiSpec(openapiPath);
  } catch (bundleError) {
    console.error('Error bundling OpenAPI spec:', bundleError);
    console.log('Falling back to reference resolution approach...');
    
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
      const resolvedSpec = resolveReferences(mainSpec, openapiPath, loadedFiles, mainSpecPath);
      
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
  
  console.log(`OpenAPI specification contains:`);
  console.log(`- ${Object.keys(spec.paths || {}).length} paths`);
  console.log(`- ${operationCount} operations`);
  
  return true;
}

/**
 * Setup Swagger UI middleware
 */
export function setupSwagger(app: any, options: any = {}): void {
  console.log('Setting up Swagger UI documentation...');
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
      docExpansion: 'list'
    }
  };
  
  // Merge options
  const uiOptions = { ...defaultOptions, ...options };
  
  try {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(openApiSpec, uiOptions));
    console.log('✨ Swagger UI documentation enabled');
  }
  catch (error) {
    console.error('Error setting up Swagger UI:', error);
  }
}

export default setupSwagger;