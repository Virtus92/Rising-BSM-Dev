/**
 * OpenAPI Validation Script
 * 
 * This script validates all OpenAPI YAML files for syntax errors and reference consistency.
 * 
 * Usage: 
 * npm run openapi:validate
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OPENAPI_DIR = path.resolve(process.cwd(), 'backend/openapi');
const PATHS_DIR = path.join(OPENAPI_DIR, 'paths');
const SCHEMAS_DIR = path.join(OPENAPI_DIR, 'schemas');

/**
 * Validate YAML file for syntax errors
 */
function validateYamlFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsedYaml = yaml.load(fileContent);
    return { valid: true, content: parsedYaml };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message,
      lineNumber: error.mark ? error.mark.line + 1 : undefined,
      column: error.mark ? error.mark.column + 1 : undefined
    };
  }
}

/**
 * Find all YAML files in a directory
 */
function findYamlFiles(directory) {
  const files = [];
  
  function traverseDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        traverseDir(fullPath);
      } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        files.push(fullPath);
      }
    }
  }
  
  traverseDir(directory);
  return files;
}

/**
 * Validate reference in OpenAPI spec
 */
function validateReference(mainSpec, reference, referencingFile) {
  try {
    // Skip external references
    if (!reference.startsWith('./')) {
      return { valid: true };
    }
    
    const [filePath, pointer] = reference.substring(2).split('#/');
    const fullPath = path.join(path.dirname(referencingFile), filePath);
    
    if (!fs.existsSync(fullPath)) {
      return {
        valid: false,
        error: `Referenced file does not exist: ${fullPath}`
      };
    }
    
    const fileResult = validateYamlFile(fullPath);
    if (!fileResult.valid) {
      return {
        valid: false,
        error: `Error in referenced file: ${fileResult.error}`
      };
    }
    
    // Check if the pointer exists in the file
    if (pointer) {
      const pointerParts = pointer.split('/');
      let currentObj = fileResult.content;
      
      for (const part of pointerParts) {
        if (!part) continue;
        
        if (!currentObj || typeof currentObj !== 'object' || !(part in currentObj)) {
          return {
            valid: false,
            error: `Reference pointer "${pointer}" not found in ${filePath}`
          };
        }
        
        currentObj = currentObj[part];
      }
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Error validating reference: ${error.message}`
    };
  }
}

/**
 * Find all references in an object
 */
function findReferences(obj, result = [], path = '') {
  if (!obj || typeof obj !== 'object') {
    return result;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findReferences(item, result, `${path}[${index}]`);
    });
    return result;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (key === '$ref' && typeof value === 'string') {
      result.push({
        path: currentPath,
        value
      });
    } else {
      findReferences(value, result, currentPath);
    }
  }
  
  return result;
}

/**
 * Validate all OpenAPI files
 */
async function validateOpenApi() {
  console.log('Validating OpenAPI files...\n');
  
  let hasErrors = false;
  
  // Validate main OpenAPI file
  const mainFilePath = path.join(OPENAPI_DIR, 'openapi.yaml');
  console.log(`Checking main file: ${mainFilePath}`);
  
  const mainFileResult = validateYamlFile(mainFilePath);
  if (!mainFileResult.valid) {
    console.error(`❌ Error in main OpenAPI file: ${mainFileResult.error}`);
    console.error(`   at line ${mainFileResult.lineNumber}, column ${mainFileResult.column}`);
    hasErrors = true;
  } else {
    console.log('✅ Main OpenAPI file is valid');
    
    // Find all references in main file
    const references = findReferences(mainFileResult.content);
    console.log(`Found ${references.length} references in main file`);
    
    // Validate each reference
    for (const ref of references) {
      const refResult = validateReference(mainFileResult.content, ref.value, mainFilePath);
      
      if (!refResult.valid) {
        console.error(`❌ Invalid reference at ${ref.path}: ${ref.value}`);
        console.error(`   Error: ${refResult.error}`);
        hasErrors = true;
      }
    }
  }
  
  console.log('\nValidating path files...');
  
  // Check all path files
  const pathFiles = findYamlFiles(PATHS_DIR);
  for (const file of pathFiles) {
    const relativePath = path.relative(OPENAPI_DIR, file);
    const result = validateYamlFile(file);
    
    if (!result.valid) {
      console.error(`❌ Error in ${relativePath}: ${result.error}`);
      console.error(`   at line ${result.lineNumber}, column ${result.column}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${relativePath} is valid`);
      
      // Validate references in this file
      const references = findReferences(result.content);
      if (references.length > 0) {
        for (const ref of references) {
          const refResult = validateReference(mainFileResult.content, ref.value, file);
          
          if (!refResult.valid) {
            console.error(`❌ Invalid reference in ${relativePath} at ${ref.path}: ${ref.value}`);
            console.error(`   Error: ${refResult.error}`);
            hasErrors = true;
          }
        }
      }
    }
  }
  
  console.log('\nValidating schema files...');
  
  // Check all schema files
  const schemaFiles = findYamlFiles(SCHEMAS_DIR);
  for (const file of schemaFiles) {
    const relativePath = path.relative(OPENAPI_DIR, file);
    const result = validateYamlFile(file);
    
    if (!result.valid) {
      console.error(`❌ Error in ${relativePath}: ${result.error}`);
      console.error(`   at line ${result.lineNumber}, column ${result.column}`);
      hasErrors = true;
    } else {
      console.log(`✅ ${relativePath} is valid`);
      
      // Validate references in this file
      const references = findReferences(result.content);
      if (references.length > 0) {
        for (const ref of references) {
          const refResult = validateReference(mainFileResult.content, ref.value, file);
          
          if (!refResult.valid) {
            console.error(`❌ Invalid reference in ${relativePath} at ${ref.path}: ${ref.value}`);
            console.error(`   Error: ${refResult.error}`);
            hasErrors = true;
          }
        }
      }
    }
  }
  
  console.log('\nValidation complete.');
  
  if (hasErrors) {
    console.error('\n❌ Validation failed with errors');
    process.exit(1);
  } else {
    console.log('\n✅ All OpenAPI files are valid');
  }
}

validateOpenApi().catch(error => {
  console.error('Unexpected error during validation:', error);
  process.exit(1);
});