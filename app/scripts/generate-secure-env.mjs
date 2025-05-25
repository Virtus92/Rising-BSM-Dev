#!/usr/bin/env node

/**
 * Generate secure environment variables for Rising-BSM
 * Run this script to generate secure secrets and credentials
 * 
 * Usage: node scripts/generate-secure-env.js
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a secure random string
 */
function generateSecureString(length: number = 64): string {
  return crypto.randomBytes(length).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, length);
}

/**
 * Generate a secure password
 */
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Ensure at least one of each type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 26)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Main function to generate secure environment variables
 */
function generateSecureEnv() {
  console.log('🔐 Generating secure environment variables for Rising-BSM...\n');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  // Read existing .env.local if it exists
  let existingEnv = '';
  if (fs.existsSync(envPath)) {
    existingEnv = fs.readFileSync(envPath, 'utf8');
    
    // Backup existing .env.local
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ Backed up existing .env.local to: ${backupPath}\n`);
  }
  
  // Generate secure values
  const jwtSecret = generateSecureString(64);
  const dbPassword = generateSecurePassword(20);
  const sessionSecret = generateSecureString(64);
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  
  // Create secure .env.local content
  const secureEnvContent = `# Database connection
# IMPORTANT: Change 'postgres' username and use the generated password
DATABASE_URL="postgresql://postgres:${dbPassword}@localhost:5432/rising_bsm?schema=public"

# API configuration
NEXT_PUBLIC_API_URL="/api"
API_TIMEOUT=15000
API_RETRIES=2

# Authentication - SECURE GENERATED VALUES
JWT_SECRET="${jwtSecret}"
JWT_AUDIENCE="rising-bsm-app"
JWT_ISSUER="rising-bsm"
ACCESS_TOKEN_LIFETIME=900       # 15 minutes in seconds
REFRESH_TOKEN_LIFETIME=2592000  # 30 days in seconds

# Session configuration
SESSION_SECRET="${sessionSecret}"
SESSION_NAME="rising-bsm-session"
SESSION_MAX_AGE=86400  # 24 hours in seconds

# Security
BCRYPT_ROUNDS=12
ENCRYPTION_KEY="${encryptionKey}"

# CORS (update for production)
ALLOWED_ORIGINS="http://localhost:3000"

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000     # 1 minute
RATE_LIMIT_MAX_REQUESTS=60     # requests per window

# Environment
NODE_ENV="development"

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"

# File upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# Email (configure for production)
# SMTP_HOST="smtp.example.com"
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER="your-email@example.com"
# SMTP_PASS="your-email-password"
# EMAIL_FROM="noreply@example.com"
`;
  
  // Write secure .env.local
  fs.writeFileSync(envPath, secureEnvContent);
  console.log('✅ Generated secure .env.local file\n');
  
  // Create .env.example if it doesn't exist
  if (!fs.existsSync(envExamplePath)) {
    const exampleContent = secureEnvContent
      .replace(jwtSecret, 'your-secure-jwt-secret-here')
      .replace(dbPassword, 'your-secure-database-password')
      .replace(sessionSecret, 'your-secure-session-secret')
      .replace(encryptionKey, 'your-32-byte-hex-encryption-key');
    
    fs.writeFileSync(envExamplePath, exampleContent);
    console.log('✅ Created .env.example file\n');
  }
  
  // Display important information
  console.log('🔑 Generated Secure Values:\n');
  console.log('JWT Secret:', jwtSecret);
  console.log('Database Password:', dbPassword);
  console.log('Session Secret:', sessionSecret);
  console.log('Encryption Key:', encryptionKey);
  
  console.log('\n⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Update your PostgreSQL database user password to match the generated password');
  console.log('2. Consider changing the default "postgres" username to something more secure');
  console.log('3. Update ALLOWED_ORIGINS for production deployment');
  console.log('4. Configure email settings for production');
  console.log('5. Never commit .env.local to version control');
  console.log('\n✨ Security configuration complete!');
}

// Run the generator
generateSecureEnv();
