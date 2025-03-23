/**
 * OpenAPI specification validator script
 * 
 * This script validates the OpenAPI specification for correctness
 * and ensures that all controllers match defined endpoints.
 */
const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Constants
const OPENAPI_PATH = path.join(__dirname, '../backend/openapi/openapi.yaml');
const CONTROLLERS_PATH = path.join(__dirname, '../backend/controllers');

// Helper functions
function getControllerFiles() {
  return fs.readdirSync(CONTROLLERS_PATH)
    .filter(file => file.endsWith('.controller.ts') || file.endsWith('.controller.js'));
}

function extractEndpointsFromController(controllerPath) {
  const content = fs.readFileSync(path.join(CONTROLLERS_PATH, controllerPath), 'utf8');
  
  // Find export functions which are likely API endpoints
  const exportRegex = /export const (\w+)/g;
  let match;
  const exportedFunctions = [];
  
  while ((match = exportRegex.exec(content)) !== null) {
    exportedFunctions.push(match[1]);
  }
  
  return exportedFunctions;
}

// Main validation function
async function validateOpenAPI() {
  console.log(chalk.blue('🔍 Validating OpenAPI specification...'));
  
  try {
    // Parse and validate OpenAPI spec
    const api = await SwaggerParser.validate(OPENAPI_PATH);
    console.log(chalk.green('✅ OpenAPI specification is valid!'));
    
    // Get all defined operation IDs from OpenAPI spec
    const operationIds = new Set();
    
    // Extract all operationIds from paths
    Object.values(api.paths).forEach(pathItem => {
      Object.values(pathItem).forEach(operation => {
        if (operation.operationId) {
          operationIds.add(operation.operationId);
        }
      });
    });
    
    console.log(chalk.blue(`📊 Found ${operationIds.size} operation IDs in OpenAPI spec`));
    
    // Compare with controller functions
    console.log(chalk.blue('\n🔄 Checking controller functions against OpenAPI spec...'));
    
    const controllerFiles = getControllerFiles();
    let totalControllerFunctions = 0;
    let missingOperationIds = [];
    
    for (const controllerFile of controllerFiles) {
      const controllerName = controllerFile.replace('.controller.ts', '').replace('.controller.js', '');
      const controllerFunctions = extractEndpointsFromController(controllerFile);
      totalControllerFunctions += controllerFunctions.length;
      
      console.log(chalk.cyan(`\n📁 Controller: ${controllerName}`));
      
      for (const func of controllerFunctions) {
        if (operationIds.has(func)) {
          console.log(chalk.green(`  ✅ ${func}`));
        } else {
          console.log(chalk.yellow(`  ⚠️ ${func} - Not found in OpenAPI spec`));
          missingOperationIds.push({ controller: controllerName, function: func });
        }
      }
    }
    
    // Summary
    console.log(chalk.blue('\n📋 Validation Summary:'));
    console.log(chalk.blue(`  - OpenAPI Operation IDs: ${operationIds.size}`));
    console.log(chalk.blue(`  - Controller Functions: ${totalControllerFunctions}`));
    
    if (missingOperationIds.length > 0) {
      console.log(chalk.yellow(`\n⚠️ Found ${missingOperationIds.length} controller functions not defined in OpenAPI spec:`));
      missingOperationIds.forEach(item => {
        console.log(chalk.yellow(`  - ${item.controller}.${item.function}`));
      });
      
      console.log(chalk.yellow('\n💡 To fix this, add appropriate operationId fields to your OpenAPI paths.'));
    } else {
      console.log(chalk.green('\n✅ All controller functions have corresponding OpenAPI operation IDs!'));
    }
    
  } catch (err) {
    console.error(chalk.red('❌ OpenAPI validation failed:'));
    console.error(chalk.red(err));
    process.exit(1);
  }
}

// Run validation
validateOpenAPI();