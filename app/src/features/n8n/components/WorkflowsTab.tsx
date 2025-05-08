'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/shared/components/ui/card';
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash, 
  Play, 
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useN8NWorkflows } from '../hooks/useN8NWorkflows';
import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Workflows management tab component
 */
export const WorkflowsTab: React.FC = () => {
  const { 
    workflows, 
    loading, 
    error,
    fetchWorkflows,
    triggerWorkflow
  } = useN8NWorkflows();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Workflow Templates</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchWorkflows}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-2" />
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))
        ) : workflows.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No workflow templates found</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Create a new workflow template or connect to your n8n instance to get started.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          // Workflow cards
          workflows.map((workflow) => (
            <WorkflowCard 
              key={workflow.id}
              workflow={workflow}
              onRun={() => triggerWorkflow(workflow.name, {})}
              onEdit={() => {/* TODO: Implement edit */}}
              onDelete={() => {/* TODO: Implement delete */}}
            />
          ))
        )}
      </div>
      
      {/* TODO: Implement create modal */}
      {/* {showCreateModal && (
        <CreateWorkflowModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          onCreate={createWorkflowTemplate}
        />
      )} */}
    </div>
  );
};

/**
 * Card component for displaying a workflow
 */
interface WorkflowCardProps {
  workflow: any;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
  workflow,
  onRun,
  onEdit,
  onDelete
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{workflow.name}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded ${
            workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {workflow.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <CardDescription>
          {workflow.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {workflow.tags.map((tag: string, i: number) => (
              <span 
                key={`${tag}-${i}`}
                className="bg-muted text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={onRun}>
            <Play className="h-3.5 w-3.5 mr-1" />
            Run
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
