import { BaseEntity } from '@/domain/entities/BaseEntity';

/**
 * Workflow template for N8N integration
 */
export class N8NWorkflowTemplate extends BaseEntity {
  name: string;
  description?: string;
  n8nWorkflowId?: string;
  configuration?: any;
  enabled: boolean;
  
  // Relations
  triggers?: any[];
  executions?: any[];
  
  constructor(data: Partial<N8NWorkflowTemplate>) {
    super(data);
    this.name = data.name || '';
    this.description = data.description;
    this.n8nWorkflowId = data.n8nWorkflowId;
    this.configuration = data.configuration;
    this.enabled = data.enabled ?? true;
    this.triggers = data.triggers || [];
    this.executions = data.executions || [];
  }
}