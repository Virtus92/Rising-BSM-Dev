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
  Webhook,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { useWebhooks } from '../hooks/useWebhooks';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Webhooks management tab component
 */
export const WebhooksTab: React.FC = () => {
  const { 
    webhooks, 
    loading, 
    error,
    fetchWebhooks,
    testWebhook,
    createWebhook,
    deleteWebhook
  } = useWebhooks();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Webhook Configurations</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchWebhooks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Webhook
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          // Loading skeletons
          Array(2).fill(0).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))
        ) : webhooks.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No webhooks configured</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Create a new webhook to receive data from external systems.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        ) : (
          // Webhook cards
          webhooks.map((webhook) => (
            <WebhookCard 
              key={webhook.id}
              webhook={webhook}
              onTest={() => testWebhook(webhook.id)}
              onEdit={() => {/* TODO: Implement edit */}}
              onDelete={() => deleteWebhook(webhook.id)}
            />
          ))
        )}
      </div>
      
      {/* TODO: Implement create modal */}
      {/* {showCreateModal && (
        <CreateWebhookModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          onCreate={createWebhook}
        />
      )} */}
    </div>
  );
};

/**
 * Card component for displaying a webhook
 */
interface WebhookCardProps {
  webhook: any;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const WebhookCard: React.FC<WebhookCardProps> = ({ 
  webhook,
  onTest,
  onEdit,
  onDelete
}) => {
  const { toast } = useToast();
  
  // Calculate the full URL (would normally come from configuration)
  const fullUrl = `${window.location.origin}/api/webhooks/n8n/${webhook.path}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Webhook URL Copied",
      description: "Webhook URL copied to clipboard",
    });
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{webhook.name}</CardTitle>
          <Badge variant={webhook.enabled ? "default" : "secondary"}>
            {webhook.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription>
          {webhook.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-1">Webhook URL</div>
          <div className="bg-muted p-2 rounded text-sm font-mono overflow-x-auto flex items-center justify-between">
            <span className="truncate">{fullUrl}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy}
              className="ml-1 flex-shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {webhook.events && webhook.events.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-1">Events</div>
            <div className="flex flex-wrap gap-1">
              {webhook.events.map((event: string, i: number) => (
                <Badge key={`${event}-${i}`} variant="outline">
                  {event}
                </Badge>
              ))}
            </div>
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
          <Button size="sm" variant="secondary" onClick={onTest}>
            <Webhook className="h-3.5 w-3.5 mr-1" />
            Test
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
