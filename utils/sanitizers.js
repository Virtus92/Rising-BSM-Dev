const xss = require('xss');

/**
 * Bereinigt Benutzereingaben von potenziell gefährlichen Inhalten
 */
function sanitizeInput(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value.trim());
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? xss(item.trim()) : sanitizeInput(item)
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeInput
};