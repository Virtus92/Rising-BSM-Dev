import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find OpenAPI directory - check multiple possible locations
function findOpenApiDir() {
  const possiblePaths = [
    '/app/openapi',  // Prioritize container path
    path.resolve(process.cwd(), 'openapi'),
    path.resolve(__dirname, '../openapi'),
    path.resolve(process.cwd(), 'backend/openapi')
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

// Determine paths
const OPENAPI_DIR = findOpenApiDir();
if (!OPENAPI_DIR) {
  process.exit(1);
}

const OUTPUT_FILE = path.resolve(process.cwd(), 'dist/swagger.json');

console.log(`Bundling OpenAPI files from ${OPENAPI_DIR} to ${OUTPUT_FILE}`);

// Load main file
const mainSpecPath = path.join(OPENAPI_DIR, 'openapi.yaml');
const mainSpecContent = fs.readFileSync(mainSpecPath, 'utf8');
const mainSpec = yaml.load(mainSpecContent);

// Track loaded files to avoid circular references
const loadedFiles = new Set([mainSpecPath]);
const loadedRefCache = new Map();

// Process schema references
function processSchemaRefs(components) {
  if (!components || !components.schemas) return components;
  
  const processedSchemas = {};
  
  for (const [schemaKey, schemaValue] of Object.entries(components.schemas)) {
    if (typeof schemaValue === 'object' && schemaValue.$ref) {
      try {
        const refString = schemaValue.$ref;
        let refPath = refString;
        let refPointer = '';
        
        if (refString.includes('#/')) {
          [refPath, refPointer] = refString.split('#/');
          refPointer = '#/' + refPointer;
        }
        
        // Handle relative paths
        const fullPath = path.resolve(OPENAPI_DIR, refPath);
        
        if (fs.existsSync(fullPath)) {
          const schemaContent = fs.readFileSync(fullPath, 'utf8');
          const schemaFileContent = yaml.load(schemaContent);
          
          // Get the referenced schema
          if (refPointer) {
            const parts = refPointer.substring(2).split('/');
            let current = schemaFileContent;
            
            for (const part of parts) {
              if (current && part in current) {
                current = current[part];
              } else {
                throw new Error(`Reference not found: ${refPointer} in ${fullPath}`);
              }
            }
            
            processedSchemas[schemaKey] = resolveReferences(current, path.dirname(fullPath));
          } else {
            processedSchemas[schemaKey] = resolveReferences(schemaFileContent, path.dirname(fullPath));
          }
        } else {
          console.warn(`Referenced file not found: ${fullPath}`);
          processedSchemas[schemaKey] = schemaValue;
        }
      } catch (error) {
        console.error(`Error processing schema ${schemaKey}:`, error.message);
        processedSchemas[schemaKey] = { 
          type: "object", 
          description: `Schema reference could not be resolved: ${error.message}` 
        };
      }
    } else {
      processedSchemas[schemaKey] = schemaValue;
    }
  }
  
  return {
    ...components,
    schemas: processedSchemas
  };
}

// Resolve path references
function resolvePathRefs(paths) {
  const resolvedPaths = {};
  
  for (const [pathKey, pathRef] of Object.entries(paths)) {
    if (typeof pathRef === 'object' && pathRef.$ref) {
      try {
        const refString = pathRef.$ref;
        let refPath = refString;
        let refPointer = '';
        
        if (refString.includes('#/')) {
          [refPath, refPointer] = refString.split('#/');
          refPointer = refPointer ? '#/' + refPointer : '';
        }
        
        // Handle relative paths
        const fullPath = path.resolve(OPENAPI_DIR, refPath);
        
        if (fs.existsSync(fullPath)) {
          const pathContent = fs.readFileSync(fullPath, 'utf8');
          const pathFileContent = yaml.load(pathContent);
          
          // Get the referenced path object
          if (refPointer) {
            const parts = refPointer.substring(2).split('/');
            let current = pathFileContent;
            
            for (const part of parts) {
              if (current && part in current) {
                current = current[part];
              } else {
                throw new Error(`Reference not found: ${refPointer} in ${fullPath}`);
              }
            }
            
            resolvedPaths[pathKey] = resolveReferences(current, path.dirname(fullPath));
          } else {
            resolvedPaths[pathKey] = resolveReferences(pathFileContent, path.dirname(fullPath));
          }
        } else {
          console.warn(`Referenced file not found: ${fullPath}`);
          resolvedPaths[pathKey] = pathRef;
        }
      } catch (error) {
        console.error(`Error processing path ${pathKey}:`, error.message);
        resolvedPaths[pathKey] = { 
          description: `Path reference could not be resolved: ${error.message}` 
        };
      }
    } else {
      resolvedPaths[pathKey] = pathRef;
    }
  }
  
  return resolvedPaths;
}

// Resolve references recursively
function resolveReferences(obj, basePath) {
  // Use a cache to avoid excessive recursion
  const cacheKey = obj && typeof obj === 'object' ? JSON.stringify(obj) : null;
  if (cacheKey && loadedRefCache.has(cacheKey)) {
    return loadedRefCache.get(cacheKey);
  }
  
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => resolveReferences(item, basePath));
  }
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      // Resolve file reference
      if (value.startsWith('#/')) {
        // Local reference - keep as is
        result[key] = value;
      } else {
        try {
          // File reference
          let refPath = value;
          let refPointer = '';
          
          if (value.includes('#/')) {
            [refPath, refPointer] = value.split('#/');
            refPointer = refPointer ? '#/' + refPointer : '';
          }
          
          // Handle relative paths
          const fullPath = path.resolve(basePath, refPath);
          
          if (!loadedFiles.has(fullPath)) {
            loadedFiles.add(fullPath);
            
            const refContent = fs.readFileSync(fullPath, 'utf8');
            let refObj = yaml.load(refContent);
            
            // Get referenced object
            if (refPointer) {
              const parts = refPointer.substring(2).split('/');
              let current = refObj;
              
              for (const part of parts) {
                if (part in current) {
                  current = current[part];
                } else {
                  console.error(`Reference not found: ${refPointer} in ${fullPath}`);
                  break;
                }
              }
              
              // Cache and return the resolved reference
              const resolved = resolveReferences(current, path.dirname(fullPath));
              loadedRefCache.set(cacheKey, resolved);
              return resolved;
            } else {
              // Cache and return the resolved reference
              const resolved = resolveReferences(refObj, path.dirname(fullPath));
              loadedRefCache.set(cacheKey, resolved);
              return resolved;
            }
          }
        } catch (error) {
          console.error(`Error resolving reference ${value}:`, error.message);
          result[key] = value; // Keep original reference on error
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = resolveReferences(value, basePath);
    } else {
      result[key] = value;
    }
  }
  
  if (cacheKey) {
    loadedRefCache.set(cacheKey, result);
  }
  return result;
}

try {
  // Process paths and components
  const resolvedPaths = resolvePathRefs(mainSpec.paths || {});
  const resolvedComponents = processSchemaRefs(mainSpec.components || {});
  
  // Create bundled spec
  const bundledSpec = {
    ...mainSpec,
    paths: resolvedPaths,
    components: resolvedComponents
  };
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating output directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write bundled spec
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundledSpec, null, 2));
  console.log(`✅ OpenAPI spec bundled successfully to ${OUTPUT_FILE}`);
  
  // Also copy to /app/dist if in container environment
  if (fs.existsSync('/app') && !OUTPUT_FILE.startsWith('/app')) {
    const containerPath = '/app/dist/swagger.json';
    const containerDir = path.dirname(containerPath);
    
    if (!fs.existsSync(containerDir)) {
      fs.mkdirSync(containerDir, { recursive: true });
    }
    
    fs.copyFileSync(OUTPUT_FILE, containerPath);
    console.log(`📋 Also copied spec to container path: ${containerPath}`);
  }
  
  // Print stats
  const pathCount = Object.keys(resolvedPaths).length;
  const schemaCount = Object.keys(resolvedComponents?.schemas || {}).length;
  console.log(`📊 Stats: ${pathCount} paths, ${schemaCount} schemas`);
} catch (error) {
  console.error('Error bundling OpenAPI spec:', error);
  process.exit(1);
}