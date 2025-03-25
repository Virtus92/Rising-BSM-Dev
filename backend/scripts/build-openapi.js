// scripts/build-openapi.js
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find OpenAPI directory
const OPENAPI_DIR = path.resolve(process.cwd(), 'backend/openapi');
const OUTPUT_FILE = path.resolve(process.cwd(), 'dist/swagger.json');

console.log(`Bundling OpenAPI files from ${OPENAPI_DIR} to ${OUTPUT_FILE}`);

// Load main file
const mainSpecPath = path.join(OPENAPI_DIR, 'openapi.yaml');
const mainSpecContent = fs.readFileSync(mainSpecPath, 'utf8');
const mainSpec = yaml.load(mainSpecContent);

// Track loaded files to avoid circular references
const loadedFiles = new Set([mainSpecPath]);

// Resolve references recursively
function resolveReferences(obj, basePath) {
  if (!obj || typeof obj !== 'object') return obj;
  
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
        // File reference
        let refPath = value;
        let refPointer = '';
        
        if (value.includes('#/')) {
          [refPath, refPointer] = value.split('#/');
          refPointer = '#/' + refPointer;
        }
        
        // Handle relative paths
        const fullPath = path.resolve(path.dirname(basePath), refPath);
        
        if (!loadedFiles.has(fullPath)) {
          loadedFiles.add(fullPath);
          console.log(`Resolving reference to ${fullPath}`);
          
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
            
            return resolveReferences(current, fullPath);
          } else {
            return resolveReferences(refObj, fullPath);
          }
        }
      }
    } else {
      result[key] = resolveReferences(value, basePath);
    }
  }
  
  return result;
}

// Bundle the spec
const bundledSpec = resolveReferences(mainSpec, mainSpecPath);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write bundled spec
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundledSpec, null, 2));
console.log(`OpenAPI spec bundled to ${OUTPUT_FILE}`);