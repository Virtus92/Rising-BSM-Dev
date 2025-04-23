/**
 * Helper functions for data validation
 */

/**
 * Validates and sanitizes an ID to ensure it's a valid positive integer
 * Robust version that extracts numeric digits from mixed input
 * 
 * @param id - ID to validate (can be string or number)
 * @returns Either the sanitized ID as a number or null if invalid
 */
export function validateId(id: string | number | null | undefined): number | null {
  if (id === undefined || id === null) {
    return null;
  }
  
  // Convert to string 
  let idStr = '';
  if (typeof id === 'number') {
    // Already a number, just convert to string
    idStr = String(id);
  } else if (typeof id === 'string') {
    // Handle string values
    if (id === 'undefined' || id === 'null') {
      return null;
    }
    idStr = id.trim(); // Ensure we trim whitespace
  } else {
    // Not a string or number
    return null;
  }
  
  // Extract only numeric digits - robust approach for handling various formats
  const numericPart = idStr.replace(/[^0-9]/g, '');
  
  // Check if we have any digits
  if (!numericPart) {
    return null;
  }
  
  // Parse as number to validate
  const numericId = parseInt(numericPart, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return null;
  }
  
  return numericId; // Return the actual number for easier usage
}

/**
 * Checks if a value is a valid positive integer ID
 * 
 * @param id - ID to validate (can be string or number)
 * @returns True if valid, false otherwise
 */
export function isValidId(id: string | number | null | undefined): boolean {
  return validateId(id) !== null;
}

/**
 * Formats validation errors into a user-friendly message
 * 
 * @param errors - Validation errors object
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');
}
