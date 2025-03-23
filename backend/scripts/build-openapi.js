// build-openapi.js
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';


/**
 * Build a bundled OpenAPI spec from the modular files
 */
(async function buildOpenApiSpec() {
  console.log('Building bundled OpenAPI spec...');
  
  // Define paths
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const rootDir = path.join(__dirname, '..', 'openapi');
  const mainSpecPath = path.join(rootDir, 'openapi.yaml');
  const outputPath = path.join(__dirname, '..', 'dist', 'swagger.json');
  
  // Track loaded files to avoid circular references
  const loadedFiles = new Set();
  loadedFiles.add(mainSpecPath);
  
  try {
    // Read and parse main OpenAPI file
    const mainSpecYaml = fs.readFileSync(mainSpecPath, 'utf8');
    const mainSpec = yaml.load(mainSpecYaml);
    
    // Resolve references
    const bundledSpec = resolveReferences(mainSpec, rootDir, loadedFiles);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write bundled spec to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(bundledSpec, null, 2));
    
    console.log(`✅ OpenAPI spec bundled successfully to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error building OpenAPI spec:', error);
    process.exit(1);
  }
})();

/**
 * Recursively resolve references in OpenAPI spec
 */
function resolveReferences(obj, rootDir, loadedFiles) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // If it's an array, resolve references in each item
  if (Array.isArray(obj)) {
    return obj.map(item => resolveReferences(item, rootDir, loadedFiles));
  }
  
  // Create a new object to avoid modifying the original
  const result = {};
  
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
          loadedFiles.add(fullPath);
          const refFileYaml = fs.readFileSync(fullPath, 'utf8');
          const refObj = yaml.load(refFileYaml);
          
          // Get referenced object using pointer
          let referencedObj = refObj;
          if (refPointer) {
            const parts = refPointer.split('/');
            for (const part of parts) {
              if (part && referencedObj) {
                referencedObj = referencedObj[part];
              }
            }
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