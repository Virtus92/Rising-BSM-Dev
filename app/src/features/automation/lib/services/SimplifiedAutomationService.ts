/**
 * Simplified Automation Service
 * 
 * This is a stub file to resolve import references.
 * The actual implementation is in AutomationService.server.ts
 */

import { AutomationService } from './AutomationService.server';

export class SimplifiedAutomationService extends AutomationService {
  // All functionality is inherited from AutomationService
}

// Helper function to create executions with correct parameter mapping
export async function createExecutionWithParams(params: any) {
  // Map pageSize to limit if present
  if (params.pageSize && !params.limit) {
    params.limit = params.pageSize;
    delete params.pageSize;
  }
  
  // Return the corrected params
  return params;
}
