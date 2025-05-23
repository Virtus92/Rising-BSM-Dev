/**
 * Simplified Payload Template System
 * 
 * Provides consistent, predictable payload templates for all entity types
 * with clear documentation of available variables
 */

import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

/**
 * Available variables for each entity type
 */
export const ENTITY_VARIABLES: Record<AutomationEntityType, string[]> = {
  [AutomationEntityType.USER]: [
    'id', 'email', 'username', 'firstName', 'lastName', 'fullName',
    'role', 'status', 'lastLogin', 'createdAt', 'updatedAt'
  ],
  [AutomationEntityType.CUSTOMER]: [
    'id', 'name', 'email', 'phone', 'company', 'notes',
    'status', 'createdAt', 'updatedAt', 'createdBy'
  ],
  [AutomationEntityType.APPOINTMENT]: [
    'id', 'title', 'description', 'startDate', 'endDate',
    'location', 'status', 'customerId', 'customerName', 'customerEmail',
    'userId', 'userName', 'createdAt', 'updatedAt'
  ],
  [AutomationEntityType.REQUEST]: [
    'id', 'name', 'email', 'phone', 'subject', 'message',
    'service', 'budget', 'urgency', 'status', 'source',
    'customerId', 'assignedTo', 'createdAt', 'updatedAt'
  ]
};

/**
 * System variables available for all entity types
 */
export const SYSTEM_VARIABLES = [
  'timestamp', 'date', 'time', 'entityType', 'operation',
  'webhookName', 'webhookId'
];

/**
 * Default templates for each entity type and operation
 */
export const DEFAULT_TEMPLATES: Record<string, Record<string, any>> = {
  // User templates
  [`${AutomationEntityType.USER}_${AutomationOperation.CREATE}`]: {
    event: 'user.created',
    timestamp: '{{timestamp}}',
    user: {
      id: '{{id}}',
      email: '{{email}}',
      username: '{{username}}',
      fullName: '{{fullName}}',
      role: '{{role}}',
      status: '{{status}}'
    }
  },
  [`${AutomationEntityType.USER}_${AutomationOperation.UPDATE}`]: {
    event: 'user.updated',
    timestamp: '{{timestamp}}',
    user: {
      id: '{{id}}',
      email: '{{email}}',
      username: '{{username}}',
      changes: '{{changes}}'
    }
  },
  
  // Customer templates
  [`${AutomationEntityType.CUSTOMER}_${AutomationOperation.CREATE}`]: {
    event: 'customer.created',
    timestamp: '{{timestamp}}',
    customer: {
      id: '{{id}}',
      name: '{{name}}',
      email: '{{email}}',
      phone: '{{phone}}',
      company: '{{company}}',
      status: '{{status}}'
    }
  },
  
  // Appointment templates
  [`${AutomationEntityType.APPOINTMENT}_${AutomationOperation.CREATE}`]: {
    event: 'appointment.created',
    timestamp: '{{timestamp}}',
    appointment: {
      id: '{{id}}',
      title: '{{title}}',
      startDate: '{{startDate}}',
      endDate: '{{endDate}}',
      customer: {
        id: '{{customerId}}',
        name: '{{customerName}}',
        email: '{{customerEmail}}'
      },
      assignedTo: {
        id: '{{userId}}',
        name: '{{userName}}'
      }
    }
  },
  [`${AutomationEntityType.APPOINTMENT}_${AutomationOperation.STATUS_CHANGED}`]: {
    event: 'appointment.status_changed',
    timestamp: '{{timestamp}}',
    appointment: {
      id: '{{id}}',
      title: '{{title}}',
      previousStatus: '{{previousStatus}}',
      newStatus: '{{status}}',
      changedBy: '{{changedBy}}'
    }
  },
  
  // Request templates
  [`${AutomationEntityType.REQUEST}_${AutomationOperation.CREATE}`]: {
    event: 'request.created',
    timestamp: '{{timestamp}}',
    request: {
      id: '{{id}}',
      name: '{{name}}',
      email: '{{email}}',
      phone: '{{phone}}',
      service: '{{service}}',
      message: '{{message}}',
      urgency: '{{urgency}}',
      budget: '{{budget}}'
    }
  },
  [`${AutomationEntityType.REQUEST}_${AutomationOperation.ASSIGNED}`]: {
    event: 'request.assigned',
    timestamp: '{{timestamp}}',
    request: {
      id: '{{id}}',
      name: '{{name}}',
      service: '{{service}}',
      assignedTo: '{{assignedTo}}',
      assignedBy: '{{assignedBy}}'
    }
  },
  [`${AutomationEntityType.REQUEST}_${AutomationOperation.STATUS_CHANGED}`]: {
    event: 'request.status_changed',
    timestamp: '{{timestamp}}',
    request: {
      id: '{{id}}',
      name: '{{name}}',
      previousStatus: '{{previousStatus}}',
      newStatus: '{{status}}',
      changedBy: '{{changedBy}}'
    }
  }
};

/**
 * Get default template for entity type and operation
 */
export function getDefaultTemplate(
  entityType: AutomationEntityType, 
  operation: AutomationOperation
): Record<string, any> {
  const key = `${entityType}_${operation}`;
  return DEFAULT_TEMPLATES[key] || {
    event: `${entityType}.${operation}`,
    timestamp: '{{timestamp}}',
    entityType: entityType,
    operation: operation,
    data: '{{data}}'
  };
}

/**
 * Build payload from template with simplified logic
 */
export function buildPayload(
  template: Record<string, any>,
  entityData: any,
  context: {
    entityType: AutomationEntityType;
    operation: AutomationOperation;
    webhookName?: string;
    webhookId?: number;
  }
): Record<string, any> {
  // If no template provided, use default
  if (!template || Object.keys(template).length === 0) {
    template = getDefaultTemplate(context.entityType, context.operation);
  }
  
  // Prepare all available variables
  const variables: Record<string, any> = {
    // Entity data (flatten if needed)
    ...flattenObject(entityData),
    
    // System variables
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    entityType: context.entityType,
    operation: context.operation,
    webhookName: context.webhookName || '',
    webhookId: context.webhookId || '',
    
    // Special handling for common fields
    fullName: entityData.fullName || `${entityData.firstName || ''} ${entityData.lastName || ''}`.trim(),
    
    // Keep raw data available
    data: entityData
  };
  
  // Process template
  return processTemplate(template, variables);
}

/**
 * Process template by replacing variables
 */
function processTemplate(template: any, variables: Record<string, any>): any {
  if (typeof template === 'string') {
    // Replace {{variable}} patterns
    return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const value = getVariable(variables, varName.trim());
      return value !== undefined ? String(value) : '';
    });
  }
  
  if (Array.isArray(template)) {
    return template.map(item => processTemplate(item, variables));
  }
  
  if (template && typeof template === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = processTemplate(value, variables);
    }
    return result;
  }
  
  return template;
}

/**
 * Get variable value with dot notation support
 */
function getVariable(variables: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let value = variables;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Flatten object for easier access
 */
function flattenObject(obj: any, prefix: string = ''): Record<string, any> {
  const result: Record<string, any> = {};
  
  if (!obj || typeof obj !== 'object') {
    return result;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Don't flatten too deep
      if (prefix.split('.').length < 2) {
        Object.assign(result, flattenObject(value, newKey));
      }
    }
    
    result[newKey] = value;
  }
  
  return result;
}

/**
 * Validate payload template
 */
export function validateTemplate(template: Record<string, any>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Check if it's valid JSON
    JSON.stringify(template);
    
    // Check for common issues
    checkTemplateIssues(template, '', errors, warnings);
    
  } catch (error) {
    errors.push('Template must be valid JSON');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check for template issues
 */
function checkTemplateIssues(
  obj: any, 
  path: string, 
  errors: string[], 
  warnings: string[]
): void {
  if (typeof obj === 'string') {
    // Check for malformed variables
    const matches = obj.match(/\{\{[^}]*\}\}/g) || [];
    for (const match of matches) {
      if (!match.match(/^\{\{[^{}]+\}\}$/)) {
        errors.push(`Invalid variable syntax at ${path}: ${match}`);
      }
    }
    return;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      checkTemplateIssues(item, `${path}[${index}]`, errors, warnings);
    });
    return;
  }
  
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      checkTemplateIssues(value, newPath, errors, warnings);
    }
  }
}

/**
 * Get template preview with sample data
 */
export function getTemplatePreview(
  template: Record<string, any>,
  entityType: AutomationEntityType,
  operation: AutomationOperation
): string {
  // Generate sample data
  const sampleData = generateSampleData(entityType);
  
  // Build payload
  const payload = buildPayload(template, sampleData, {
    entityType,
    operation,
    webhookName: 'Sample Webhook',
    webhookId: 1
  });
  
  // Return formatted JSON
  return JSON.stringify(payload, null, 2);
}

/**
 * Generate sample data for entity type
 */
function generateSampleData(entityType: AutomationEntityType): any {
  const now = new Date();
  
  switch (entityType) {
    case AutomationEntityType.USER:
      return {
        id: 123,
        email: 'john.doe@example.com',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        status: 'active',
        lastLogin: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
    case AutomationEntityType.CUSTOMER:
      return {
        id: 456,
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-1234',
        company: 'Acme Corp',
        notes: 'Important client',
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        createdBy: 123
      };
      
    case AutomationEntityType.APPOINTMENT:
      return {
        id: 789,
        title: 'Project Review Meeting',
        description: 'Quarterly project review',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 3600000).toISOString(),
        location: 'Conference Room A',
        status: 'scheduled',
        customerId: 456,
        customerName: 'Acme Corporation',
        customerEmail: 'contact@acme.com',
        userId: 123,
        userName: 'John Doe',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
    case AutomationEntityType.REQUEST:
      return {
        id: 321,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-5678',
        subject: 'Website Redesign',
        message: 'We need a complete website redesign...',
        service: 'Web Development',
        budget: '$10,000 - $25,000',
        urgency: 'high',
        status: 'new',
        source: 'website',
        customerId: null,
        assignedTo: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
    default:
      return {
        id: 999,
        type: entityType,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
  }
}
