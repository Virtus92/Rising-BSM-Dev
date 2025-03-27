#!/usr/bin/env node

/**
 * Swagger UI Diagnostic Script
 * 
 * A standalone script to diagnose and fix Swagger UI issues.
 * 
 * Usage:
 *   node swagger-diagnostic.js [--fix]
 * 
 * Options:
 *   --fix    Attempt to fix common issues
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { exec } = require('child_process');

// Root directory
const rootDir = process.cwd();

// Configuration (using default values, can be overridden by .env)
const config = {
  BACKEND_HOST: process.env.BACKEND_HOST || 'localhost',
  BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '5000'),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ENABLED: process.env.CORS_ENABLED !== 'false',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(origin => origin.trim()),
  SWAGGER_ENABLED: process.env.SWAGGER_ENABLED !== 'false',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Logger
const logger = {
  info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  warn: (message) => console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  debug: (message) => console.log(`${colors.gray}[DEBUG]${colors.reset} ${message}`)
};

// Diagnostic results
const results = {
  swaggerConfigured: false,
  corsConfigured: false,
  specAvailable: false,
  apiReachable: false,
  networkIssues: false,
  issues: [],
  recommendations: []
};

// Parse command line arguments
const shouldFix = process.argv.includes('--fix');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Run diagnostics
 */
async function runDiagnostics() {
  logger.info('Starting Swagger UI diagnostics...');
  
  // Load environment variables
  await loadEnvironmentVariables();
  
  // Check Swagger configuration
  checkSwaggerConfiguration();
  
  // Check CORS configuration
  checkCorsConfiguration();
  
  // Check for OpenAPI spec
  await checkSpecAvailability();
  
  // Check API reachability
  await checkApiReachability();
  
  // Check network configuration
  checkNetworkConfiguration();
  
  // Generate recommendations
  generateRecommendations();
  
  // Print results
  printResults();
  
  // Apply fixes if requested
  if (shouldFix) {
    await applyFixes();
  } else {
    const answer = await question('Would you like to apply automated fixes? (y/n) ');
    if (answer.toLowerCase() === 'y') {
      await applyFixes();
    }
  }
  
  rl.close();
}

/**
 * Load environment variables from .env file
 */
async function loadEnvironmentVariables() {
  const envPath = path.join(rootDir, '.env');
  
  if (fs.existsSync(envPath)) {
    logger.info(`Loading environment variables from ${envPath}`);
    
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('#') || !trimmedLine) {
        continue;
      }
      
      // Parse key=value
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        // Update config if key exists
        if (key in config) {
          if (key === 'BACKEND_PORT') {
            config[key] = parseInt(value);
          } else if (key === 'CORS_ORIGINS') {
            config[key] = value.split(',').map(origin => origin.trim());
          } else if (key === 'CORS_ENABLED' || key === 'SWAGGER_ENABLED') {
            config[key] = value !== 'false';
          } else {
            config[key] = value;
          }
        }
      }
    }
  } else {
    logger.warn('.env file not found. Using default configuration.');
  }
  
  logger.debug('Configuration:', config);
}

/**
 * Check Swagger configuration
 */
function checkSwaggerConfiguration() {
  logger.info('Checking Swagger configuration...');
  
  results.swaggerConfigured = config.SWAGGER_ENABLED;
  
  if (!results.swaggerConfigured) {
    results.issues.push('Swagger UI is disabled in configuration');
  } else {
    logger.success('Swagger UI is enabled');
  }
}

/**
 * Check CORS configuration
 */
function checkCorsConfiguration() {
  logger.info('Checking CORS configuration...');
  
  if (!config.CORS_ENABLED) {
    results.issues.push('CORS is disabled which will prevent Swagger UI from making API requests');
    return;
  }
  
  const corsOrigins = config.CORS_ORIGINS;
  
  if (corsOrigins.length === 0) {
    results.issues.push('No CORS origins configured');
    return;
  }
  
  // For Swagger UI, we need localhost origins or '*'
  const hasLocalhost = corsOrigins.some(origin => 
    origin.includes('localhost') || origin === '*'
  );
  
  if (!hasLocalhost && config.NODE_ENV === 'development') {
    results.issues.push('CORS origins do not include localhost which may prevent Swagger UI from working');
  }
  
  results.corsConfigured = true;
  logger.success(`CORS is enabled with origins: ${corsOrigins.join(', ')}`);
}

/**
 * Check OpenAPI spec availability
 */
async function checkSpecAvailability() {
  logger.info('Checking OpenAPI spec availability...');
  
  // Check for OpenAPI spec file
  const possiblePaths = [
    path.join(rootDir, 'dist/swagger.json'),
    path.join(rootDir, 'backend/dist/swagger.json'),
    path.join(rootDir, 'openapi/openapi.yaml'),
    path.join(rootDir, 'backend/openapi/openapi.yaml')
  ];
  
  let specFound = false;
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      specFound = true;
      logger.success(`Found OpenAPI spec at: ${filePath}`);
      
      // Check if spec is valid
      try {
        if (filePath.endsWith('.json')) {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content); // Will throw if invalid JSON
        } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
          // We already know the file exists, so consider it valid for now
        }
      } catch (error) {
        specFound = false;
        results.issues.push(`OpenAPI spec at ${filePath} is not valid: ${error.message}`);
      }
      
      break;
    }
  }
  
  // Check if spec is accessible via HTTP
  try {
    const host = config.BACKEND_HOST === '0.0.0.0' ? 'localhost' : config.BACKEND_HOST;
    const port = config.BACKEND_PORT;
    
    const response = await httpGet(`http://${host}:${port}/swagger.json`);
    if (response) {
      specFound = true;
      logger.success('OpenAPI spec is accessible via HTTP');
    }
  } catch (error) {
    // If we already found a file spec, this is not critical
    if (!specFound) {
      results.issues.push('OpenAPI spec is not accessible via HTTP');
    }
  }
  
  if (!specFound) {
    results.issues.push('OpenAPI specification not found');
  }
  
  results.specAvailable = specFound;
}

/**
 * Check API reachability
 */
async function checkApiReachability() {
  logger.info('Checking API reachability...');
  
  // Try to access the API health endpoint
  try {
    const host = config.BACKEND_HOST === '0.0.0.0' ? 'localhost' : config.BACKEND_HOST;
    const port = config.BACKEND_PORT;
    
    logger.info(`Checking API reachability at http://${host}:${port}/health`);
    
    const response = await httpGet(`http://${host}:${port}/health`);
    if (response) {
      logger.success('API is reachable');
      
      // Check if the response is valid
      try {
        const data = JSON.parse(response);
        if (data.status === 'ok') {
          logger.success('API health check successful');
          results.apiReachable = true;
        } else {
          results.issues.push('API health check failed: Unexpected response');
        }
      } catch (error) {
        results.issues.push('API health check returned invalid JSON');
      }
    }
  } catch (error) {
    results.issues.push(`API is not reachable: ${error.message}`);
    
    // Check if server is running on a different port
    try {
      for (const testPort of [3000, 8000, 8080]) {
        if (testPort === config.BACKEND_PORT) continue;
        
        const host = config.BACKEND_HOST === '0.0.0.0' ? 'localhost' : config.BACKEND_HOST;
        const response = await httpGet(`http://${host}:${testPort}/health`);
        
        if (response) {
          results.issues.push(`API appears to be running on port ${testPort} instead of configured port ${config.BACKEND_PORT}`);
          break;
        }
      }
    } catch {
      // No alternative port found
    }
  }
}

/**
 * Check network configuration
 */
function checkNetworkConfiguration() {
  logger.info('Checking network configuration...');
  
  // Check Docker environment
  const isDocker = fs.existsSync('/.dockerenv');
  
  if (isDocker) {
    logger.info('Running in Docker environment');
    
    // Check HOST configuration
    if (config.BACKEND_HOST === 'localhost') {
      results.issues.push('HOST is set to "localhost" which might not work correctly in Docker');
      results.networkIssues = true;
    }
    
    // Check DATABASE_URL if available
    const databaseUrl = process.env.DATABASE_URL || '';
    if (databaseUrl.includes('localhost')) {
      results.issues.push('DATABASE_URL contains "localhost" which might not work correctly in Docker');
      results.networkIssues = true;
    }
  }
  
  // Check for common network issues
  if (config.BACKEND_HOST === '0.0.0.0' && !isDocker) {
    logger.info('Server is configured to listen on all interfaces (0.0.0.0)');
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations() {
  logger.info('Generating recommendations...');
  
  // Add common recommendations based on issues found
  if (results.issues.length > 0) {
    // If Swagger UI is not working at all
    if (!results.swaggerConfigured) {
      results.recommendations.push('Enable Swagger UI by setting SWAGGER_ENABLED=true in your .env file');
    }
    
    // If CORS is not configured correctly
    if (!results.corsConfigured) {
      results.recommendations.push('Enable CORS by setting CORS_ENABLED=true in your .env file');
      results.recommendations.push('Add appropriate origins to CORS_ORIGINS in your .env file, e.g., CORS_ORIGINS=http://localhost:5000,http://localhost:3000');
    }
    
    // If OpenAPI spec is not available
    if (!results.specAvailable) {
      results.recommendations.push('Create an OpenAPI specification in openapi/openapi.yaml or dist/swagger.json');
      results.recommendations.push('Make sure the /swagger.json endpoint is properly configured');
    }
    
    // If API is not reachable
    if (!results.apiReachable) {
      results.recommendations.push('Ensure your API server is running and accessible');
      results.recommendations.push('Check that your server is listening on the correct port and host');
    }
    
    // If there are network issues
    if (results.networkIssues) {
      results.recommendations.push('Update HOST to "0.0.0.0" in your configuration to listen on all interfaces');
      results.recommendations.push('When using Docker, use service names instead of "localhost" in URLs');
    }
  } else {
    results.recommendations.push('All diagnostics passed. Swagger UI should be working correctly.');
  }
}

/**
 * Print diagnostic results
 */
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.cyan}Swagger UI Diagnostic Results${colors.reset}`);
  console.log('='.repeat(80));
  
  console.log(`${colors.blue}Configuration:${colors.reset}`);
  console.log(`  Host:           ${config.BACKEND_HOST}`);
  console.log(`  Port:           ${config.BACKEND_PORT}`);
  console.log(`  API Prefix:     ${config.API_PREFIX}`);
  console.log(`  CORS Enabled:   ${config.CORS_ENABLED}`);
  console.log(`  CORS Origins:   ${config.CORS_ORIGINS.join(', ')}`);
  console.log(`  Swagger Enabled: ${config.SWAGGER_ENABLED}`);
  console.log(`  Environment:    ${config.NODE_ENV}`);
  
  console.log(`\n${colors.blue}Status:${colors.reset}`);
  console.log(`  Swagger Configured: ${formatStatus(results.swaggerConfigured)}`);
  console.log(`  CORS Configured:    ${formatStatus(results.corsConfigured)}`);
  console.log(`  OpenAPI Spec:       ${formatStatus(results.specAvailable)}`);
  console.log(`  API Reachable:      ${formatStatus(results.apiReachable)}`);
  
  if (results.issues.length > 0) {
    console.log(`\n${colors.yellow}Issues (${results.issues.length}):${colors.reset}`);
    results.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  } else {
    console.log(`\n${colors.green}No issues detected!${colors.reset}`);
  }
  
  console.log(`\n${colors.magenta}Recommendations:${colors.reset}`);
  results.recommendations.forEach((recommendation, index) => {
    console.log(`  ${index + 1}. ${recommendation}`);
  });
  
  console.log('='.repeat(80) + '\n');
}

/**
 * Apply fixes for common issues
 */
async function applyFixes() {
  logger.info('Applying fixes for common issues...');
  
  let fixesApplied = false;
  
  // Fix 1: Create dist directory if it doesn't exist
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    try {
      fs.mkdirSync(distDir, { recursive: true });
      logger.success(`Created dist directory at ${distDir}`);
      fixesApplied = true;
    } catch (error) {
      logger.error(`Failed to create dist directory: ${error.message}`);
    }
  }
  
  // Fix 2: Create a simple swagger.json if none exists
  const swaggerJsonPath = path.join(distDir, 'swagger.json');
  if (!fs.existsSync(swaggerJsonPath) && !results.specAvailable) {
    try {
      const simpleSpec = createSimpleOpenApiSpec();
      fs.writeFileSync(swaggerJsonPath, JSON.stringify(simpleSpec, null, 2), 'utf8');
      logger.success(`Created simple OpenAPI spec at ${swaggerJsonPath}`);
      fixesApplied = true;
    } catch (error) {
      logger.error(`Failed to create OpenAPI spec: ${error.message}`);
    }
  }
  
  // Fix 3: Create a Swagger UI custom JS file
  const swaggerCustomJsPath = path.join(distDir, 'swagger-custom.js');
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
    logger.success(`Created Swagger UI custom JS file at ${swaggerCustomJsPath}`);
    fixesApplied = true;
  } catch (error) {
    logger.error(`Failed to create Swagger UI custom JS: ${error.message}`);
  }
  
  // Fix 4: Create or update .env file with correct settings
  if (!results.corsConfigured || !results.swaggerConfigured) {
    const envPath = path.join(rootDir, '.env');
    try {
      let envContent = '';
      
      // Read existing .env file if it exists
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Add or update CORS settings
      if (!results.corsConfigured) {
        if (!envContent.includes('CORS_ENABLED')) {
          envContent += '\nCORS_ENABLED=true';
        } else {
          envContent = envContent.replace(/CORS_ENABLED\s*=\s*false/g, 'CORS_ENABLED=true');
        }
        
        if (!envContent.includes('CORS_ORIGINS')) {
          envContent += '\nCORS_ORIGINS=http://localhost:5000,http://localhost:3000,http://127.0.0.1:5000';
        }
      }
      
      // Add or update Swagger settings
      if (!results.swaggerConfigured) {
        if (!envContent.includes('SWAGGER_ENABLED')) {
          envContent += '\nSWAGGER_ENABLED=true';
        } else {
          envContent = envContent.replace(/SWAGGER_ENABLED\s*=\s*false/g, 'SWAGGER_ENABLED=true');
        }
      }
      
      fs.writeFileSync(envPath, envContent, 'utf8');
      logger.success(`Updated .env file at ${envPath}`);
      fixesApplied = true;
    } catch (error) {
      logger.error(`Failed to update .env file: ${error.message}`);
    }
  }
  
  // Fix 5: Test CORS configuration
  if (!results.corsConfigured || !results.apiReachable) {
    logger.info('Testing CORS configuration...');
    
    try {
      await execCommand('curl -X OPTIONS -i http://localhost:' + config.BACKEND_PORT + '/health -H "Origin: http://localhost:3000"');
    } catch (error) {
      logger.warn('CORS test failed, but this might be expected if the server is not running');
    }
  }
  
  if (fixesApplied) {
    logger.success('Fixes applied successfully! You may need to restart your server for changes to take effect.');
  } else {
    logger.warn('No fixes were applied.');
  }
}

/**
 * Create a simple OpenAPI specification
 */
function createSimpleOpenApiSpec() {
  const host = config.BACKEND_HOST === '0.0.0.0' ? 'localhost' : config.BACKEND_HOST;
  const port = config.BACKEND_PORT;
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
      }
    }
  };
}

/**
 * Format status for display
 * 
 * @param {boolean} status - Status value
 * @returns {string} Formatted status
 */
function formatStatus(status) {
  return status ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

/**
 * Helper function for HTTP GET requests
 * 
 * @param {string} url - URL to request
 * @returns {Promise<string>} Response body
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
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

/**
 * Execute a command and return the output
 * 
 * @param {string} command - Command to execute
 * @returns {Promise<string>} Command output
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      resolve(stdout);
    });
  });
}

/**
 * Ask a question and get the answer
 * 
 * @param {string} question - Question to ask
 * @returns {Promise<string>} Answer
 */
function question(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run diagnostics
runDiagnostics().catch((error) => {
  logger.error(`Diagnostics failed: ${error.message}`);
  process.exit(1);
});