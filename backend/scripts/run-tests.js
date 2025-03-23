#!/usr/bin/env node

/**
 * Test Runner Script for CI/CD environments
 * 
 * This script runs tests and validates OpenAPI specifications
 * with configurable thresholds for test coverage.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  coverage: {
    statements: 75,
    branches: 70,
    functions: 80,
    lines: 75
  },
  timeout: 60000, // 60 seconds timeout for test execution
  openApiValidation: true,
  reportDir: 'coverage',
  failFast: process.env.CI === 'true' // Fail fast in CI environment
};

// Helper functions
function logInfo(message) {
  console.log(chalk.blue(`ℹ️ ${message}`));
}

function logSuccess(message) {
  console.log(chalk.green(`✅ ${message}`));
}

function logWarning(message) {
  console.log(chalk.yellow(`⚠️ ${message}`));
}

function logError(message) {
  console.error(chalk.red(`❌ ${message}`));
}

function executeCommand(command, silent = false) {
  try {
    return execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      timeout: CONFIG.timeout
    }).toString();
  } catch (error) {
    if (CONFIG.failFast) {
      logError(`Command failed: ${command}`);
      logError(error.message);
      process.exit(1);
    } else {
      logWarning(`Command failed but continuing: ${command}`);
      logWarning(error.message);
      return null;
    }
  }
}

function checkCoverageThresholds(coverageData) {
  const results = {
    passed: true,
    details: {}
  };

  // Check each threshold
  for (const [metric, threshold] of Object.entries(CONFIG.coverage)) {
    const actual = coverageData.total[metric].pct;
    const passed = actual >= threshold;
    
    results.details[metric] = {
      threshold,
      actual,
      passed
    };
    
    if (!passed) {
      results.passed = false;
    }
  }
  
  return results;
}

// Main functions
async function runUnitTests() {
  logInfo('Running unit tests...');
  executeCommand('npm run test:unit');
  logSuccess('Unit tests completed');
}

async function runIntegrationTests() {
  logInfo('Running integration tests...');
  executeCommand('npm run test:integration');
  logSuccess('Integration tests completed');
}

async function runTestsWithCoverage() {
  logInfo('Running tests with coverage...');
  executeCommand('npm run test:coverage');
  
  // Read coverage results
  try {
    const coverageSummary = path.join(process.cwd(), CONFIG.reportDir, 'coverage-summary.json');
    if (fs.existsSync(coverageSummary)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageSummary, 'utf8'));
      
      // Check coverage against thresholds
      const results = checkCoverageThresholds(coverageData);
      
      if (results.passed) {
        logSuccess('Coverage thresholds met:');
      } else {
        logError('Coverage thresholds not met:');
      }
      
      // Log coverage details
      for (const [metric, data] of Object.entries(results.details)) {
        const logFunction = data.passed ? logSuccess : logError;
        logFunction(`  ${metric}: ${data.actual}% (threshold: ${data.threshold}%)`);
      }
      
      if (!results.passed && CONFIG.failFast) {
        process.exit(1);
      }
    } else {
      logWarning('Coverage report not found');
    }
  } catch (error) {
    logError('Error reading coverage data: ' + error.message);
    if (CONFIG.failFast) {
      process.exit(1);
    }
  }
}

async function validateOpenApi() {
  if (!CONFIG.openApiValidation) {
    return;
  }
  
  logInfo('Validating OpenAPI specification...');
  executeCommand('npm run openapi:validate');
  logSuccess('OpenAPI validation completed');
}

async function bundleOpenApi() {
  if (!CONFIG.openApiValidation) {
    return;
  }
  
  logInfo('Bundling OpenAPI specification...');
  executeCommand('npm run openapi:bundle');
  logSuccess('OpenAPI bundling completed');
}

async function main() {
  try {
    logInfo('Starting test runner...');
    logInfo(`Test configuration: ${JSON.stringify(CONFIG, null, 2)}`);
    
    // Run different test phases
    await runTestsWithCoverage();
    await validateOpenApi();
    await bundleOpenApi();
    
    logSuccess('All tests and validations completed successfully!');
  } catch (error) {
    logError('Test execution failed:');
    logError(error.stack);
    process.exit(1);
  }
}

// Execute main function
main();