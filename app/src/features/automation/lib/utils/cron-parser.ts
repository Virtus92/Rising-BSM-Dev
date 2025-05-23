/**
 * Cron expression parser and utilities
 */

/**
 * Basic cron validation
 */
export function validateCronExpression(cronExpression: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!cronExpression?.trim()) {
    errors.push('Cron expression is required');
    return { isValid: false, errors };
  }
  
  const parts = cronExpression.trim().split(/\s+/);
  
  // Should have 5 or 6 parts
  if (parts.length < 5 || parts.length > 6) {
    errors.push('Cron expression must have 5 or 6 parts (minute hour day month weekday [year])');
    return { isValid: false, errors };
  }
  
  // Basic validation for each part
  const [minute, hour, day, month, weekday, year] = parts;
  
  // Validate minute (0-59)
  if (!isValidCronPart(minute, 0, 59)) {
    errors.push('Invalid minute field (0-59)');
  }
  
  // Validate hour (0-23)
  if (!isValidCronPart(hour, 0, 23)) {
    errors.push('Invalid hour field (0-23)');
  }
  
  // Validate day (1-31)
  if (!isValidCronPart(day, 1, 31)) {
    errors.push('Invalid day field (1-31)');
  }
  
  // Validate month (1-12)
  if (!isValidCronPart(month, 1, 12)) {
    errors.push('Invalid month field (1-12)');
  }
  
  // Validate weekday (0-7, where 0 and 7 are Sunday)
  if (!isValidCronPart(weekday, 0, 7)) {
    errors.push('Invalid weekday field (0-7)');
  }
  
  // Validate year if present (1970-3000)
  if (year && !isValidCronPart(year, 1970, 3000)) {
    errors.push('Invalid year field (1970-3000)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a single cron field
 */
function isValidCronPart(part: string, min: number, max: number): boolean {
  if (!part) return false;
  
  // Allow wildcards
  if (part === '*') return true;
  
  // Allow question mark for day/weekday
  if (part === '?') return true;
  
  // Handle ranges (e.g., 1-5)
  if (part.includes('-')) {
    const [start, end] = part.split('-');
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    return !isNaN(startNum) && !isNaN(endNum) && 
           startNum >= min && endNum <= max && startNum <= endNum;
  }
  
  // Handle lists (e.g., 1,3,5)
  if (part.includes(',')) {
    const values = part.split(',');
    return values.every(val => {
      const num = parseInt(val);
      return !isNaN(num) && num >= min && num <= max;
    });
  }
  
  // Handle step values (e.g., */5, 0-59/5)
  if (part.includes('/')) {
    const [range, step] = part.split('/');
    const stepNum = parseInt(step);
    if (isNaN(stepNum) || stepNum <= 0) return false;
    
    if (range === '*') return true;
    
    // Validate the range part
    return isValidCronPart(range, min, max);
  }
  
  // Handle single numbers
  const num = parseInt(part);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Converts cron expression to human-readable description
 */
export function describeCronExpression(cronExpression: string): string {
  try {
    const validation = validateCronExpression(cronExpression);
    if (!validation.isValid) {
      return 'Invalid cron expression';
    }
    
    const parts = cronExpression.trim().split(/\s+/);
    const [minute, hour, day, month, weekday] = parts;
    
    // Simple descriptions for common patterns
    if (cronExpression === '0 0 * * *') {
      return 'Every day at midnight';
    }
    
    if (cronExpression === '0 12 * * *') {
      return 'Every day at noon';
    }
    
    if (cronExpression === '0 0 * * 0') {
      return 'Every Sunday at midnight';
    }
    
    if (cronExpression === '0 9 * * 1-5') {
      return 'Every weekday at 9:00 AM';
    }
    
    if (cronExpression === '0 0 1 * *') {
      return 'First day of every month at midnight';
    }
    
    if (cronExpression.startsWith('*/')) {
      const interval = cronExpression.split(' ')[0].replace('*/', '');
      return `Every ${interval} minutes`;
    }
    
    // Build description from parts
    let description = 'Runs ';
    
    // Minute
    if (minute === '*') {
      description += 'every minute ';
    } else if (minute.includes('/')) {
      const interval = minute.split('/')[1];
      description += `every ${interval} minutes `;
    } else {
      description += `at minute ${minute} `;
    }
    
    // Hour
    if (hour !== '*') {
      if (hour.includes(',')) {
        description += `at hours ${hour} `;
      } else if (hour.includes('-')) {
        description += `between hours ${hour} `;
      } else {
        description += `at ${hour}:00 `;
      }
    }
    
    // Day
    if (day !== '*') {
      description += `on day ${day} `;
    }
    
    // Month
    if (month !== '*') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (month.includes(',')) {
        const months = month.split(',').map(m => monthNames[parseInt(m) - 1]).join(', ');
        description += `in ${months} `;
      } else {
        description += `in ${monthNames[parseInt(month) - 1]} `;
      }
    }
    
    // Weekday
    if (weekday !== '*') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (weekday.includes(',')) {
        const days = weekday.split(',').map(d => dayNames[parseInt(d)]).join(', ');
        description += `on ${days}`;
      } else if (weekday.includes('-')) {
        description += `from ${dayNames[parseInt(weekday.split('-')[0])]} to ${dayNames[parseInt(weekday.split('-')[1])]}`;
      } else {
        description += `on ${dayNames[parseInt(weekday)]}`;
      }
    }
    
    return description.trim();
  } catch (error) {
    return 'Invalid cron expression';
  }
}

/**
 * Common cron expressions
 */
export const COMMON_CRON_EXPRESSIONS = {
  'Every minute': '* * * * *',
  'Every 5 minutes': '*/5 * * * *',
  'Every 15 minutes': '*/15 * * * *',
  'Every 30 minutes': '*/30 * * * *',
  'Every hour': '0 * * * *',
  'Every 2 hours': '0 */2 * * *',
  'Every day at midnight': '0 0 * * *',
  'Every day at noon': '0 12 * * *',
  'Every day at 6 AM': '0 6 * * *',
  'Every day at 6 PM': '0 18 * * *',
  'Every weekday at 9 AM': '0 9 * * 1-5',
  'Every Sunday at midnight': '0 0 * * 0',
  'Every Monday at 9 AM': '0 9 * * 1',
  'First day of every month': '0 0 1 * *',
  'Last day of every month': '0 0 L * *', // Note: This is Quartz syntax, may not work in all systems
  'Every week on Sunday': '0 0 * * 0',
  'Every month on the 15th': '0 0 15 * *',
  'Every quarter (Jan, Apr, Jul, Oct)': '0 0 1 1,4,7,10 *'
};

/**
 * Gets the next run time for a cron expression (basic approximation)
 * Note: This is a simplified implementation. For production use, consider using a proper cron library.
 */
export function getNextRunTime(cronExpression: string, timezone: string = 'UTC', fromDate?: Date): Date {
  const now = fromDate || new Date();
  
  // This is a very basic implementation
  // In a real application, you would use a proper cron library like 'cron-parser' or 'node-cron'
  
  try {
    const validation = validateCronExpression(cronExpression);
    if (!validation.isValid) {
      throw new Error('Invalid cron expression');
    }
    
    // For now, return a simple approximation
    // This would need to be replaced with proper cron parsing logic
    const nextRun = new Date(now);
    
    // Simple patterns
    if (cronExpression === '0 0 * * *') {
      // Daily at midnight
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
    } else if (cronExpression === '0 * * * *') {
      // Every hour
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
    } else if (cronExpression.startsWith('*/')) {
      // Every X minutes
      const minutes = parseInt(cronExpression.split(' ')[0].replace('*/', ''));
      nextRun.setMinutes(nextRun.getMinutes() + minutes, 0, 0);
    } else {
      // Default: next hour
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
    }
    
    return nextRun;
  } catch (error) {
    // If parsing fails, default to next hour
    const nextRun = new Date(now);
    nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
    return nextRun;
  }
}

/**
 * Checks if a cron expression is due to run
 */
export function isCronDue(cronExpression: string, lastRun?: Date, timezone: string = 'UTC'): boolean {
  try {
    const now = new Date();
    const nextRun = getNextRunTime(cronExpression, timezone, lastRun);
    return now >= nextRun;
  } catch (error) {
    return false;
  }
}
