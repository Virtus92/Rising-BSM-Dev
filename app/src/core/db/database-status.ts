/**
 * Database Status Checker
 * 
 * Provides utilities to check database connectivity and manage outage detection
 * This centralizes database status information to help components adapt to database outages
 */

import { getLogger } from '@/core/logging';
import { db } from './index';

// Database status tracking
let databaseConnectionFailed = false;
let lastDatabaseFailure = 0;
let lastSuccessfulConnection = Date.now();
let failureCount = 0;
const MAX_FAILURE_COUNT = 3;
const DB_RECOVERY_WINDOW = 60 * 1000; // 1 minute
const PING_TIMEOUT = 5000; // 5 second timeout for ping queries

// Function types for database status callbacks
type DatabaseStatusCallback = (isConnected: boolean, failureTime: number) => void;

// Callbacks for status changes
const onFailureCallbacks: DatabaseStatusCallback[] = [];
const onRecoveryCallbacks: DatabaseStatusCallback[] = [];

/**
 * Check if the database is currently in outage mode
 * 
 * @returns Boolean indicating if database is in outage and recovery info
 */
export function getDatabaseStatus(): {
  isInOutage: boolean;
  lastFailure: Date | null;
  failureCount: number;
  recoveryWindow: number; // ms
  recoveryAt: Date | null;
  lastSuccess: Date;
} {
  const now = Date.now();
  const isInOutage = databaseConnectionFailed && (now - lastDatabaseFailure < DB_RECOVERY_WINDOW);
  
  return {
    isInOutage,
    lastFailure: lastDatabaseFailure ? new Date(lastDatabaseFailure) : null,
    failureCount,
    recoveryWindow: DB_RECOVERY_WINDOW,
    recoveryAt: lastDatabaseFailure ? new Date(lastDatabaseFailure + DB_RECOVERY_WINDOW) : null,
    lastSuccess: new Date(lastSuccessfulConnection)
  };
}

/**
 * Check current database connectivity with a lightweight query
 * 
 * @returns Promise resolving to true if database is connected
 */
export async function pingDatabase(): Promise<boolean> {
  const logger = getLogger();
  const pingId = `ping-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  logger.debug(`Pinging database with ID: ${pingId}`);
  
  try {
    // Set up a timeout promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Database ping timed out')), PING_TIMEOUT);
    });
    
    // Set up actual database query
    const queryPromise = db.$queryRaw`SELECT 1 as ping`.then(() => true);
    
    // Race the query against the timeout
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // If we get here, the query was successful
    if (databaseConnectionFailed) {
      logger.info(`Database connection recovered after failure (ping ID: ${pingId})`);
      databaseConnectionFailed = false;
      lastSuccessfulConnection = Date.now();
      failureCount = 0;
      
      // Notify recovery callbacks
      onRecoveryCallbacks.forEach(callback => {
        try {
          callback(true, lastSuccessfulConnection);
        } catch (callbackError) {
          logger.error('Error in database recovery callback', callbackError as Error);
        }
      });
    }
    
    return true;
  } catch (error) {
    // Log detailed error
    logger.error(`Database ping failed (ID: ${pingId})`, {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : String(error)
    });
    
    // Update status
    databaseConnectionFailed = true;
    lastDatabaseFailure = Date.now();
    failureCount++;
    
    // Notify failure callbacks if this is the first failure or crosses threshold
    if (failureCount === 1 || failureCount === MAX_FAILURE_COUNT) {
      onFailureCallbacks.forEach(callback => {
        try {
          callback(false, lastDatabaseFailure);
        } catch (callbackError) {
          logger.error('Error in database failure callback', callbackError as Error);
        }
      });
    }
    
    return false;
  }
}

/**
 * Register a callback function for database failure events
 * 
 * @param callback Function to call when database failure is detected
 */
export function onDatabaseFailure(callback: DatabaseStatusCallback): void {
  onFailureCallbacks.push(callback);
}

/**
 * Register a callback function for database recovery events
 * 
 * @param callback Function to call when database recovers from failure
 */
export function onDatabaseRecovery(callback: DatabaseStatusCallback): void {
  onRecoveryCallbacks.push(callback);
}

/**
 * Mark the database as failed manually (useful for testing or when errors are caught elsewhere)
 */
export function markDatabaseFailed(): void {
  const logger = getLogger();
  logger.warn('Database manually marked as failed');
  
  databaseConnectionFailed = true;
  lastDatabaseFailure = Date.now();
  failureCount++;
  
  // Notify failure callbacks
  onFailureCallbacks.forEach(callback => {
    try {
      callback(false, lastDatabaseFailure);
    } catch (callbackError) {
      logger.error('Error in database failure callback', callbackError as ErrorEventInit);
    }
  });
}

/**
 * Reset database status (useful for testing or after fixing issues manually)
 */
export function resetDatabaseStatus(): void {
  const logger = getLogger();
  logger.info('Database status reset');
  
  databaseConnectionFailed = false;
  lastDatabaseFailure = 0;
  failureCount = 0;
  lastSuccessfulConnection = Date.now();
  
  // Notify recovery callbacks
  onRecoveryCallbacks.forEach(callback => {
    try {
      callback(true, lastSuccessfulConnection);
    } catch (callbackError) {
      logger.error('Error in database recovery callback', callbackError as Error);
    }
  });
}

export default {
  getDatabaseStatus,
  pingDatabase,
  onDatabaseFailure,
  onDatabaseRecovery,
  markDatabaseFailed,
  resetDatabaseStatus
};