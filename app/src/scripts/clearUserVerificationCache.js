/**
 * Clear User Verification Cache Utility
 * 
 * This script creates an empty file that, when detected by the application,
 * will trigger a clearing of the user verification cache in the middleware.
 * 
 * Usage: node scripts/clearUserVerificationCache.js
 */

const fs = require('fs');
const path = require('path');

// Path to the cache clear flag file
const flagFilePath = path.join(__dirname, '..', '..', 'tmp', 'clear_verification_cache');

// Create tmp directory if it doesn't exist
const tmpDir = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log(`Created directory: ${tmpDir}`);
}

// Create the flag file with the current timestamp
const timestamp = new Date().toISOString();
fs.writeFileSync(flagFilePath, `Verification cache clear requested at ${timestamp}`);

console.log('User verification cache clear flag created.');
console.log(`Flag file: ${flagFilePath}`);
console.log('The verification cache will be cleared on the next middleware execution.');
console.log('\nNote