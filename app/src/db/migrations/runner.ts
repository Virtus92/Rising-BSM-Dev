/**
 * Database Migration Runner
 * 
 * This file helps apply database migrations like indices
 * and other performance optimizations.
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '@/core/db/prisma/client';
import { getLogger } from '@/core/logging';

const logger = getLogger();

interface MigrationResult {
  migrationName: string;
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Apply all migrations in the migrations directory
 */
export async function applyMigrations(): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  const migrationsDir = path.join(process.cwd(), 'src/db/migrations');
  
  try {
    // Check if directory exists
    if (!fs.existsSync(migrationsDir)) {
      logger.error('Migrations directory not found', { path: migrationsDir });
      return [];
    }
    
    // Get all SQL files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Apply in alphabetical order
    
    logger.info(`Found ${files.length} migration files to process`);
    
    // Apply each migration
    for (const file of files) {
      const startTime = performance.now();
      try {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split the SQL file into separate statements
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        // Execute each statement
        for (const statement of statements) {
          await prisma.$executeRawUnsafe(statement + ';');
        }
        
        const duration = Math.round(performance.now() - startTime);
        logger.info(`Successfully applied migration: ${file}`, { duration });
        
        results.push({
          migrationName: file,
          success: true,
          duration
        });
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error(`Failed to apply migration: ${file}`, {
          error: errorMessage,
          duration
        });
        
        results.push({
          migrationName: file,
          success: false,
          error: errorMessage,
          duration
        });
      }
    }
    
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error applying migrations', { error: errorMessage });
    return [];
  }
}

// For command-line usage
if (require.main === module) {
  applyMigrations()
    .then(results => {
      const succeeded = results.filter(r => r.success).length;
      const failed = results.length - succeeded;
      
      console.log(`Migration results: ${succeeded} succeeded, ${failed} failed`);
      
      if (failed > 0) {
        console.error('Failed migrations:');
        results.filter(r => !r.success).forEach(r => {
          console.error(`- ${r.migrationName}: ${r.error}`);
        });
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(err => {
      console.error('Error running migrations:', err);
      process.exit(1);
    });
}
