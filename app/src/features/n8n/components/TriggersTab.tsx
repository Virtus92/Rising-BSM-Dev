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
  Zap,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useTriggers } from '../hooks/useTriggers';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';

/**
 * Triggers management tab component
 */
export const TriggersTab: React.FC = () => {
  const { 
    triggers, 
    loading, 
    error,
    fetchTriggers,
    testTrigger,
    createTrigger,
    deleteTrigger
  } = useTriggers();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Group triggers by event type for easier management
  const triggersByEventType = triggers.reduce((acc: Record<string, any[]>, trigger: any) => {
    if (!acc[trigger.eventType]) {
      acc[trigger.eventType] = [];
    }
    acc[trigger.eventType].push(trigger);
    return acc;
  }, {});
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Event Triggers</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchTriggers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Trigger
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      
      {loading ? (
        // Loading skeletons
        <div className="space-y-6">
          {Array(2).fill(0).map((_, i) => (
            <div key={`skeleton-group-${i}`}>
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="grid gap-4 md:grid-cols-2">
                {Array(2).fill(0).map((_, j) => (
                  <Card key={`skeleton-${i}-${j}`} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-full mb-2" />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(triggersByEventType).length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No triggers configured</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Create triggers to automatically run workflows when events occur.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Trigger
          </Button>
        </div>
      ) : (
        // Triggers grouped by event type
        <div className="space-y-6">
          {Object.entries(triggersByEventType).map(([eventType, eventTriggers]) => (
            <div key={eventType}>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <Badge 
                  className="mr-2" 
                  variant={eventType.includes('appointment') ? 'default' : 
                            eventType.includes('request') ? 'secondary' : 
                            eventType.includes('user') ? 'outline' : 
                            'destructive'}
                >
                  {eventType}
                </Badge>
                <span>{getTriggerGroupTitle(eventType)}</span>
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                {eventTriggers.map((trigger) => (
                  <TriggerCard 
                    key={trigger.id}
                    trigger={trigger}
                    onTest={() => testTrigger(trigger.id)}
                    onEdit={() => {/* TODO: Implement edit */}}
                    onDelete={() => deleteTrigger(trigger.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* TODO: Implement create modal */}
      {/* {showCreateModal && (
        <CreateTriggerModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          onCreate={createTrigger}
        />
      )} */}
    </div>
  );
};

/**
 * Get a human-readable title for a trigger group
 */
function getTriggerGroupTitle(eventType: string): string {
  if (eventType.startsWith('request.')) {
    return 'Request Events';
  } else if (eventType.startsWith('appointment.')) {
    return 'Appointment Events';
  } else if (eventType.startsWith('user.')) {
    return 'User Events';
  } else if (eventType.startsWith('time.')) {
    return 'Time-based Events';
  }
  return 'Other Events';
}

/**
 * Card component for displaying a trigger
 */
interface TriggerCardProps {
  trigger: any;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TriggerCard: React.FC<TriggerCardProps> = ({ 
  trigger,
  onTest,
  onEdit,
  onDelete
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{trigger.name}</CardTitle>
          <Badge variant={trigger.enabled ? "default" : "secondary"}>
            {trigger.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription>
          Triggers workflow: <strong>{trigger.workflowTemplate?.name || 'Unknown workflow'}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trigger.entityType && (
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-1">Entity:</span>
              <Badge variant="outline">{trigger.entityType}</Badge>
            </div>
          )}
          
          {trigger.configuration && (
            <div>
              {trigger.eventType.startsWith('time.') && trigger.configuration.schedule && (
                <div className="flex items-center text-sm">
                  <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>Runs {formatSchedule(trigger.configuration.schedule)}</span>
                </div>
              )}
            </div>
          )}
        </div>
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
          <Button size="sm" variant="secondary" onClick={onTest}>
            <Zap className="h-3.5 w-3.5 mr-1" />
            Test
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

/**
 * Format a schedule configuration into a human-readable string
 */
function formatSchedule(schedule: any): string {
  if (schedule.type === 'cron') {
    return `on schedule: ${schedule.expression}`;
  } else if (schedule.type === 'interval') {
    const { value, unit } = schedule;
    return `every ${value} ${unit}${value !== 1 ? 's' : ''}`;
  } else if (schedule.type === 'specificTime') {
    return `at ${schedule.time} daily`;
  }
  return JSON.stringify(schedule);
}