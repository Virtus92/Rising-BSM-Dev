/**
 * TypeScript Verification File
 * 
 * This file verifies that all the automation types and interfaces are correctly set up.
 * If this file compiles without errors, the type system is working correctly.
 */

import { IAutomationService } from '@/domain/services/IAutomationService';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';
import { getAutomationService } from '@/features/automation/lib/services/getAutomationService';

// Type verification - these should all compile without errors
async function verifyTypes() {
  // Get the service
  const service: IAutomationService = await getAutomationService();
  
  // Verify all methods exist on the interface
  const variables = await service.getAvailableVariables(AutomationEntityType.USER);
  console.log('Variables:', variables.entityVariables, variables.systemVariables);
  
  const template = await service.getDefaultTemplateForEntity(
    AutomationEntityType.REQUEST,
    AutomationOperation.CREATE
  );
  console.log('Template:', template);
  
  const preview = await service.previewTemplate(
    { test: '{{id}}' },
    AutomationEntityType.CUSTOMER,
    AutomationOperation.UPDATE
  );
  console.log('Preview:', preview);
  
  // Verify enum values
  const operations: AutomationOperation[] = [
    AutomationOperation.CREATE,
    AutomationOperation.UPDATE,
    AutomationOperation.DELETE,
    AutomationOperation.STATUS_CHANGED,
    AutomationOperation.ASSIGNED,
    AutomationOperation.COMPLETED
  ];
  console.log('Operations:', operations);
  
  // Verify webhook methods
  const webhooks = await service.getWebhooks({ 
    entityType: AutomationEntityType.USER,
    operation: AutomationOperation.CREATE,
    page: 1,
    limit: 10
  });
  console.log('Webhooks:', webhooks.total);
}

// Export to prevent "unused file" warnings
export { verifyTypes };
