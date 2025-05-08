import { BaseEntity } from '@/domain/entities/BaseEntity';

/**
 * Trigger configuration for N8N integration
 */
export class N8NTrigger extends BaseEntity {
  name: string;
  eventType: string;
  entityType?: string;
  configuration?: any;
  enabled: boolean;
  
  // Relations
  workflowTemplateId: number;
  workflowTemplate?: any;
  
  constructor(data: Partial<N8NTrigger>) {
    super(data);
    this.name = data.name || '';
    this.eventType = data.eventType || '';
    this.entityType = data.entityType;
    this.configuration = data.configuration;
    this.enabled = data.enabled ?? true;
    this.workflowTemplateId = data.workflowTemplateId!;
    this.workflowTemplate = data.workflowTemplate;
  }
}