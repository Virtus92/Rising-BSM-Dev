/**
 * Payload template utilities for webhook automation
 */

/**
 * Builds a webhook payload from a template and entity data
 */
export function buildPayloadFromTemplate(
  template: Record<string, any>,
  entityData: any,
  entityType?: string,
  operation?: string
): Record<string, any> {
  try {
    // If template is empty, return entity data as-is
    if (!template || Object.keys(template).length === 0) {
      return {
        entityType,
        data: entityData,
        timestamp: new Date().toISOString()
      };
    }
    
    // Deep clone the template to avoid mutation
    const payload = JSON.parse(JSON.stringify(template));
    
    // Replace template variables in the payload
    return replaceTemplateVariables(payload, entityData, entityType, operation);
  } catch (error) {
    console.error('Error building payload from template:', error);
    // Fallback to basic payload
    return {
      entityType,
      data: entityData,
      timestamp: new Date().toISOString(),
      error: 'Template processing failed'
    };
  }
}

/**
 * Recursively replaces template variables in an object
 */
function replaceTemplateVariables(
  obj: any,
  entityData: any,
  entityType?: string,
  operation?: string
): any {
  if (typeof obj === 'string') {
    return replaceStringTemplate(obj, entityData, entityType, operation);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceTemplateVariables(item, entityData, entityType, operation));
  }
  
  if (obj && typeof obj === 'object') {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceTemplateVariables(value, entityData, entityType, operation);
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Replaces template variables in a string
 */
function replaceStringTemplate(
  template: string,
  entityData: any,
  entityType?: string,
  operation?: string
): string {
  if (typeof template !== 'string') {
    return template;
  }
  
  // Available template variables
  const variables = {
    // Entity data
    ...flattenObject(entityData, 'entity'),
    
    // Metadata
    entityType: entityType || 'unknown',
    operation: operation || 'unknown',
    timestamp: new Date().toISOString(),
    
    // Entity shorthand (for backward compatibility)
    id: entityData?.id,
    name: entityData?.name,
    email: entityData?.email,
    status: entityData?.status,
    service: entityData?.service,
    message: entityData?.message,

    
    // Date formats
    date: new Date().toLocaleDateString(),
    isoDate: new Date().toISOString(),
    time: new Date().toLocaleTimeString(),
  };
  
  // Replace template variables
  let result = template;
  
  // Replace {{variable}} patterns
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    const value = getNestedValue(variables, trimmedName);
    return value !== undefined ? String(value) : match;
  });
  
  // Replace ${variable} patterns
  result = result.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
    const trimmedName = variableName.trim();
    const value = getNestedValue(variables, trimmedName);
    return value !== undefined ? String(value) : match;
  });
  
  return result;
}

/**
 * Flattens a nested object with dot notation
 */
function flattenObject(obj: any, prefix: string = ''): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  if (!obj || typeof obj !== 'object') {
    return flattened;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || typeof path !== 'string') {
    return undefined;
  }
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Validates a payload template
 */
export function validatePayloadTemplate(template: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  try {
    // Check if template is valid JSON-serializable
    JSON.stringify(template);
    
    // Check for common template issues
    validateTemplateRecursively(template, '', errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    errors.push('Template must be valid JSON');
    return {
      isValid: false,
      errors
    };
  }
}

/**
 * Recursively validates template structure
 */
function validateTemplateRecursively(
  obj: any,
  path: string,
  errors: string[]
): void {
  if (typeof obj === 'string') {
    // Check for malformed template variables
    const invalidPatterns = [
      /\{\{[^}]*\{/g,  // Nested braces
      /\}\}[^}]*\}/g,  // Malformed closing
      /\$\{[^}]*\$/g,  // Nested dollar braces
    ];
    
    invalidPatterns.forEach(pattern => {
      if (pattern.test(obj)) {
        errors.push(`Invalid template syntax in "${path}": ${obj}`);
      }
    });
    
    return;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      validateTemplateRecursively(item, `${path}[${index}]`, errors);
    });
    return;
  }
  
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      validateTemplateRecursively(value, newPath, errors);
    }
  }
}

/**
 * Common payload templates
 */
export const COMMON_PAYLOAD_TEMPLATES = {
  // Basic entity notification
  basic: {
    event: 'entity.{{entityType}}.created',
    timestamp: '{{timestamp}}',
    data: {
      id: '{{entity.id}}',
      name: '{{entity.name}}',
      email: '{{entity.email}}',
      status: '{{entity.status}}'
    }
  },
  
  // Slack notification
  slack: {
    text: 'New {{entityType}} created: {{entity.name}}',
    attachments: [
      {
        color: 'good',
        fields: [
          {
            title: 'ID',
            value: '{{entity.id}}',
            short: true
          },
          {
            title: 'Email',
            value: '{{entity.email}}',
            short: true
          },
          {
            title: 'Created',
            value: '{{timestamp}}',
            short: true
          }
        ]
      }
    ]
  },
  
  // Discord webhook
  discord: {
    username: 'Rising-BSM Bot',
    embeds: [
      {
        title: 'New {{entityType}} Created',
        description: '**{{entity.name}}** has been created',
        color: 3447003,
        fields: [
          {
            name: 'ID',
            value: '{{entity.id}}',
            inline: true
          },
          {
            name: 'Email',
            value: '{{entity.email}}',
            inline: true
          }
        ],
        timestamp: '{{isoDate}}'
      }
    ]
  },
  
  // Microsoft Teams
  teams: {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: 'New {{entityType}} created',
    themeColor: '0078D4',
    sections: [
      {
        activityTitle: 'New {{entityType}} Created',
        activitySubtitle: '{{entity.name}}',
        facts: [
          {
            name: 'ID',
            value: '{{entity.id}}'
          },
          {
            name: 'Email',
            value: '{{entity.email}}'
          },
          {
            name: 'Created',
            value: '{{timestamp}}'
          }
        ]
      }
    ]
  },
  
  // Generic API call
  api: {
    action: 'create',
    resource: '{{entityType}}',
    payload: {
      id: '{{entity.id}}',
      name: '{{entity.name}}',
      email: '{{entity.email}}',
      status: '{{entity.status}}',
      createdAt: '{{entity.createdAt}}',
      updatedAt: '{{entity.updatedAt}}'
    },
    metadata: {
      timestamp: '{{timestamp}}',
      source: 'rising-bsm'
    }
  }
};

/**
 * Gets a template by name
 */
export function getTemplateByName(name: string): Record<string, any> | null {
  return COMMON_PAYLOAD_TEMPLATES[name as keyof typeof COMMON_PAYLOAD_TEMPLATES] || null;
}

/**
 * Lists available template names
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(COMMON_PAYLOAD_TEMPLATES);
}
