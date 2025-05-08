import React, { useState, useEffect } from 'react';
import { useWebhooks } from '../hooks/useWebhooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Spinner } from '@/shared/components/ui/spinner';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { XIcon } from 'lucide-react';

interface WebhookFormProps {
  webhook?: any;
  onSave?: (webhook: any) => void;
  onCancel?: () => void;
}

/**
 * Component for creating or editing N8N webhooks
 */
export const WebhookForm: React.FC<WebhookFormProps> = ({
  webhook,
  onSave,
  onCancel
}) => {
  const { createWebhook, updateWebhook } = useWebhooks();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [path, setPath] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState('');

  // Available event types (this would typically come from your system)
  const availableEventTypes = [
    'request.created',
    'request.updated',
    'request.status.changed',
    'customer.created',
    'customer.updated',
    'appointment.created',
    'appointment.updated',
    'appointment.status.changed',
    'user.created',
    'user.updated',
  ];

  // Initialize form with webhook data if editing
  useEffect(() => {
    if (webhook) {
      setName(webhook.name || '');
      setDescription(webhook.description || '');
      setPath(webhook.path || '');
      setCategory(webhook.category || '');
      setActive(webhook.active !== undefined ? webhook.active : true);
      setEvents(webhook.events || []);
    }
  }, [webhook]);

  // Handle event addition
  const handleAddEvent = (event: string) => {
    if (event && !events.includes(event)) {
      setEvents([...events, event]);
      setNewEvent('');
    }
  };

  // Handle event removal
  const handleRemoveEvent = (event: string) => {
    setEvents(events.filter(e => e !== event));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required fields
    if (!name || !path) {
      setError('Name and Path are required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const webhookData = {
        name,
        description,
        path,
        category,
        active,
        events
      };
      
      // If webhook has an ID, we're updating
      let response;
      if (webhook?.id) {
        response = await updateWebhook(webhook.id, webhookData);
      } else {
        response = await createWebhook(webhookData);
      }
      
      if (response && onSave) {
        onSave(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{webhook ? 'Edit Webhook' : 'Create Webhook'}</CardTitle>
          <CardDescription>
            {webhook 
              ? 'Edit the webhook configuration' 
              : 'Create a new webhook to integrate with N8N'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name" className="required">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Webhook name"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Webhook description"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="path" className="required">Path</Label>
            <Input
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="webhook/path"
              required
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              The relative path for this webhook (e.g., webhook/customer)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Webhook category"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch 
                id="active" 
                checked={active} 
                onCheckedChange={setActive}
                disabled={loading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Enable or disable this webhook
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Event Types</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {events.map((event) => (
                <Badge key={event} variant="secondary" className="flex items-center gap-1">
                  {event}
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(event)}
                    className="rounded-full hover:bg-background/20 p-0.5"
                    disabled={loading}
                  >
                    <XIcon className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </button>
                </Badge>
              ))}
              {events.length === 0 && (
                <span className="text-sm text-muted-foreground">No events selected</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                placeholder="Add event type..."
                disabled={loading}
                list="event-suggestions"
              />
              <datalist id="event-suggestions">
                {availableEventTypes.map((event) => (
                  <option key={event} value={event} />
                ))}
              </datalist>
              <Button 
                type="button" 
                onClick={() => handleAddEvent(newEvent)}
                disabled={!newEvent.trim() || loading}
              >
                Add
              </Button>
            </div>
            
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Suggested Events:</p>
              <div className="grid grid-cols-2 gap-2">
                {availableEventTypes.slice(0, 6).map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`event-${event}`}
                      checked={events.includes(event)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleAddEvent(event);
                        } else {
                          handleRemoveEvent(event);
                        }
                      }}
                      disabled={loading}
                    />
                    <Label htmlFor={`event-${event}`} className="text-sm cursor-pointer">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" className="mr-2" /> : null}
            {webhook ? 'Update Webhook' : 'Create Webhook'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
