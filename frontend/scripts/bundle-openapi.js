const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Find the OpenAPI directory by checking multiple possible locations
 */
function findOpenApiDir() {
  const possiblePaths = [
    '/app/openapi',
    path.resolve(process.cwd(), 'openapi')
  ];
  
  console.log('Searching for OpenAPI directory in the following locations:');
  for (const dir of possiblePaths) {
    console.log(`- Checking ${dir}`);
    if (fs.existsSync(path.join(dir, 'openapi.yaml'))) {
      console.log(`✅ Found OpenAPI directory at: ${dir}`);
      return dir;
    }
  }
  
  console.error('❌ Could not find OpenAPI directory!');
  return null;
}

/**
 * Load and parse a YAML file
 */
function loadYamlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (error) {
    console.error(`Error loading YAML file ${filePath}:`, error.message);
    if (error.mark) {
      console.error(`  at line ${error.mark.line + 1}, column ${error.mark.column + 1}`);
    }
    return null;
  }
}

/**
 * Resolves a reference path to an absolute file path
 */
function resolveRefPath(refPath, basePath) {
  if (!refPath) return null;
  
  // Handle local references (in the same file)
  if (refPath.startsWith('#/')) {
    return { filePath: basePath, pointer: refPath.substring(2) };
  }
  
  let filePath, pointer = '';
  
  // Split file path and pointer
  if (refPath.includes('#/')) {
    const [refFilePath, refPointer] = refPath.split('#/');
    filePath = refFilePath;
    pointer = refPointer;
  } else {
    filePath = refPath;
  }
  
  // Resolve file path relative to base path
  if (filePath.startsWith('./')) {
    filePath = path.resolve(path.dirname(basePath), filePath.substring(2));
  } else if (filePath.startsWith('../')) {
    filePath = path.resolve(path.dirname(basePath), filePath);
  } else if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(path.dirname(basePath), filePath);
  }
  
  return { filePath, pointer };
}

/**
 * Follow a JSON pointer to find the referenced object
 */
function followPointer(obj, pointer) {
  if (!pointer) return obj;
  
  const parts = pointer.split('/');
  let current = obj;
  
  for (const part of parts) {
    if (!part) continue;
    
    // Handle JSON pointer escaping
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    
    if (!current || typeof current !== 'object' || !(key in current)) {
      console.error(`Cannot follow pointer: ${pointer}, stuck at ${key}`);
      return null;
    }
    
    current = current[key];
  }
  
  return current;
}

/**
 * Resolve a reference and return the referenced object
 */
function resolveReference(ref, basePath, cache, visitedRefs = new Set()) {
  // Avoid circular references
  const refKey = `${basePath}#${ref}`;
  if (visitedRefs.has(refKey)) {
    console.warn(`Circular reference detected: ${refKey}`);
    return { type: 'object', description: 'Circular reference detected' };
  }
  
  visitedRefs.add(refKey);
  
  // Check if we've already resolved this reference
  if (cache.has(refKey)) {
    return cache.get(refKey);
  }
  
  const { filePath, pointer } = resolveRefPath(ref, basePath);
  if (!filePath) {
    return null;
  }
  
  // Load the file if it exists
  if (!fs.existsSync(filePath)) {
    console.error(`Referenced file does not exist: ${filePath} (from ${basePath}, ref ${ref})`);
    return null;
  }
  
  const content = loadYamlFile(filePath);
  if (!content) {
    return null;
  }
  
  // Follow the pointer to get the referenced object
  const referencedObj = followPointer(content, pointer);
  if (!referencedObj) {
    return null;
  }
  
  // Resolve any nested references
  const resolvedObj = resolveReferences(referencedObj, filePath, cache, visitedRefs);
  cache.set(refKey, resolvedObj);
  
  return resolvedObj;
}

/**
 * Resolve all references in an object
 */
function resolveReferences(obj, basePath, cache = new Map(), visitedRefs = new Set()) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => resolveReferences(item, basePath, cache, visitedRefs));
  }
  
  // Handle special case - reference object
  if (obj.$ref && typeof obj.$ref === 'string') {
    const resolved = resolveReference(obj.$ref, basePath, cache, new Set(visitedRefs));
    if (resolved) {
      // If there are additional properties besides $ref, we should merge them
      const rest = {};
      for (const key in obj) {
        if (key !== '$ref') rest[key] = obj[key];
      }
      if (Object.keys(rest).length > 0) {
        return { ...resolved, ...rest };
      }
      return resolved;
    }
    // Keep original reference if resolution fails
    return obj;
  }
  
  // Regular object
  const result = {};
  for (const key in obj) {
    result[key] = resolveReferences(obj[key], basePath, cache, visitedRefs);
  }
  
  return result;
}

/**
 * Process OpenAPI paths
 */
function processPaths(paths, basePath, cache) {
  const result = {};
  
  for (const pathKey in paths) {
    const pathObj = paths[pathKey];
    if (pathObj.$ref) {
      // Path is a reference to another file
      const resolved = resolveReference(pathObj.$ref, basePath, cache);
      if (resolved) {
        result[pathKey] = resolved;
      } else {
        console.error(`Failed to resolve path reference: ${pathObj.$ref}`);
        result[pathKey] = { description: `Failed to resolve reference: ${pathObj.$ref}` };
      }
    } else {
      // Path is defined inline
      result[pathKey] = resolveReferences(pathObj, basePath, cache);
    }
  }
  
  return result;
}

/**
 * Process OpenAPI components
 */
function processComponents(components, basePath, cache) {
  if (!components) return components;
  
  const result = {};
  
  for (const sectionKey in components) {
    const section = components[sectionKey];
    result[sectionKey] = {};
    
    for (const key in section) {
      const value = section[key];
      if (value.$ref) {
        // Component is a reference to another file
        const resolved = resolveReference(value.$ref, basePath, cache);
        if (resolved) {
          result[sectionKey][key] = resolved;
        } else {
          console.error(`Failed to resolve component reference: ${value.$ref}`);
          result[sectionKey][key] = { 
            type: 'object',
            description: `Failed to resolve reference: ${value.$ref}` 
          };
        }
      } else {
        // Component is defined inline
        result[sectionKey][key] = resolveReferences(value, basePath, cache);
      }
    }
  }
  
  return result;
}

/**
 * Save the bundled spec to a file
 */
function saveSpec(spec, outputPath) {
  try {
    const dir = path.dirname(outputPath);
    console.log(`Attempting to save to directory: ${dir}`);
    
    if (!fs.existsSync(dir)) {
      console.log(`Directory doesn't exist, creating: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    console.log(`✅ Bundled spec saved successfully to: ${outputPath}`);
    
    // Also save to container path if applicable
    if (!outputPath.startsWith('/app') && fs.existsSync('/app')) {
      const containerPath = '/app/dist/swagger.json';
      const containerDir = path.dirname(containerPath);
      if (!fs.existsSync(containerDir)) {
        fs.mkdirSync(containerDir, { recursive: true });
      }
      fs.writeFileSync(containerPath, JSON.stringify(spec, null, 2));
      console.log(`✅ Also saved spec to container path: ${containerPath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to save spec to ${outputPath}: ${error.message}`);
    console.error(error);
    
    // Fallback to saving in the current directory if dist fails
    try {
      const fallbackPath = path.join(process.cwd(), 'swagger.json');
      console.log(`Trying fallback location: ${fallbackPath}`);
      fs.writeFileSync(fallbackPath, JSON.stringify(spec, null, 2));
      console.log(`Saved to fallback location: ${fallbackPath}`);
    } catch (fallbackError) {
      console.error(`Also failed to save to fallback location: ${fallbackError.message}`);
    }
  }
}

/**
 * Bundle the OpenAPI specification
 */
function bundleOpenApi() {
  // Find the OpenAPI directory
  const openapiDir = findOpenApiDir();
  if (!openapiDir) {
    process.exit(1);
  }
  
  // Create a default openapi.yaml file if it doesn't exist
  const mainSpecPath = path.join(openapiDir, 'openapi.yaml');
  if (!fs.existsSync(mainSpecPath)) {
    console.log('Creating default OpenAPI specification...');
    const defaultSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Rising BSM API',
        version: '1.0.0',
        description: 'API for Rising BSM',
      },
      paths: {},
      components: {
        schemas: {},
        responses: {
          Error: {
            description: 'An error occurred',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', format: 'int32' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
    
    fs.writeFileSync(mainSpecPath, yaml.dump(defaultSpec));
    console.log(`Created default specification at ${mainSpecPath}`);
  }
  
  // Output file path
  const outputPath = path.resolve(process.cwd(), 'dist/swagger.json');
  
  // Load the main OpenAPI file
  const mainSpec = loadYamlFile(mainSpecPath);
  
  if (!mainSpec) {
    console.error('Failed to load main OpenAPI spec!');
    process.exit(1);
  }
  
  console.log('Bundling OpenAPI specification...');
  const cache = new Map();
  
  // Process paths
  if (mainSpec.paths) {
    console.log('Processing paths...');
    mainSpec.paths = processPaths(mainSpec.paths, mainSpecPath, cache);
  }
  
  // Process components
  if (mainSpec.components) {
    console.log('Processing components...');
    mainSpec.components = processComponents(mainSpec.components, mainSpecPath, cache);
  }
  
  // Save the bundled spec
  saveSpec(mainSpec, outputPath);
  
  // Calculate some stats
  const pathCount = Object.keys(mainSpec.paths || {}).length;
  const schemaCount = Object.keys((mainSpec.components && mainSpec.components.schemas) || {}).length;
  const responseCount = Object.keys((mainSpec.components && mainSpec.components.responses) || {}).length;
  
  console.log('\nOpenAPI Bundling Complete!');
  console.log(`Paths: ${pathCount}`);
  console.log(`Schemas: ${schemaCount}`);
  console.log(`Responses: ${responseCount}`);
  console.log(`References resolved: ${cache.size}`);
}

// Run the bundler
bundleOpenApi();
