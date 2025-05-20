-- Database Optimization Script
-- This script adds necessary indexes to improve query performance
-- for authentication and permission-related tables

-- Add index to UserPermission table for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_user_permission_user_id 
ON "UserPermission" ("userId");

-- Add index to RefreshToken table for faster token lookups
CREATE INDEX IF NOT EXISTS idx_refresh_token_token 
ON "RefreshToken" ("token");

-- Add index to RefreshToken for finding revoked tokens
CREATE INDEX IF NOT EXISTS idx_refresh_token_revoked 
ON "RefreshToken" ("isRevoked", "revokedAt") 
WHERE "isRevoked" = true;

-- Add index for user lookup by ID (most common query in logs)
CREATE INDEX IF NOT EXISTS idx_user_id 
ON "User" ("id");

-- Add index for permission lookups
CREATE INDEX IF NOT EXISTS idx_permission_code 
ON "Permission" ("code");

-- Add combined index for token expiration checks
CREATE INDEX IF NOT EXISTS idx_refresh_token_user_expires 
ON "RefreshToken" ("userId", "expiresAt");

-- Add index for notification queries that appear in logs
CREATE INDEX IF NOT EXISTS idx_notification_user_read 
ON "Notification" ("userId", "read");

-- Update statistics to ensure the query planner uses these indexes
ANALYZE "UserPermission";
ANALYZE "RefreshToken";
ANALYZE "User";
ANALYZE "Permission";
ANALYZE "Notification";
