import { BaseEntity } from '@/domain/entities/BaseEntity';

/**
 * Execution record for N8N integration
 */
export class N8NExecution extends BaseEntity {
  externalId: string;
  triggerType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  
  // Relations
  workflowTemplateId?: number;
  workflowTemplate?: any;
  webhookId?: number;
  webhook?: any;
  
  // Polymorphic relation
  entityType?: string;
  entityId?: number;
  
  constructor(data: Partial<N8NExecution>) {
    super(data);
    this.externalId = data.externalId || '';
    this.triggerType = data.triggerType || '';
    this.status = data.status || 'pending';
    this.startedAt = data.startedAt || new Date();
    this.completedAt = data.completedAt;
    this.result = data.result;
    this.error = data.error;
    this.workflowTemplateId = data.workflowTemplateId;
    this.workflowTemplate = data.workflowTemplate;
    this.webhookId = data.webhookId;
    this.webhook = data.webhook;
    this.entityType = data.entityType;
    this.entityId = data.entityId;
  }
}