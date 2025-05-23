'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  TestTube, 
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Webhook,
  PlayCircle,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAutomation } from '../hooks/useAutomation';
import { WebhookForm } from './WebhookForm';
import { ScheduleForm } from './ScheduleForm';

interface AutomationListProps {
  type: 'webhook' | 'schedule';
  items: any[];
  onRefresh: () => void;
}

export function AutomationList({ type, items, onRefresh }: AutomationListProps) {
  const { 
    toggleWebhook, 
    toggleSchedule, 
    deleteWebhook, 
    deleteSchedule,
    executeSchedule,
    loading 
  } = useAutomation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type === 'webhook' && (
      item.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operation.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      if (type === 'webhook') {
        await toggleWebhook(id, !currentStatus);
      } else {
        await toggleSchedule(id, !currentStatus);
      }
      onRefresh();
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (type === 'webhook') {
        await deleteWebhook(id);
      } else {
        await deleteSchedule(id);
      }
      onRefresh();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleExecuteSchedule = async (id: string) => {
    try {
      await executeSchedule(id);
      onRefresh();
    } catch (error) {
      console.error('Error executing schedule:', error);
    }
  };

  const getStatusBadge = (active: boolean) => (
    <Badge variant={active ? 'default' : 'secondary'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );

  const getEntityTypeBadge = (entityType: string) => (
    <Badge variant="outline" className="capitalize">
      {entityType.replace('_', ' ')}
    </Badge>
  );

  const getOperationBadge = (operation: string) => (
    <Badge variant="outline" className="capitalize">
      {operation}
    </Badge>
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getNextRunStatus = (schedule: any) => {
    if (!schedule.active) return null;
    
    const nextRun = new Date(schedule.nextRunAt);
    const now = new Date();
    const diffMinutes = Math.floor((nextRun.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (diffMinutes < 60) {
      return <Badge variant="default">Due in {diffMinutes}m</Badge>;
    } else if (diffMinutes < 1440) {
      return <Badge variant="outline">Due in {Math.floor(diffMinutes / 60)}h</Badge>;
    } else {
      return <Badge variant="outline">Due in {Math.floor(diffMinutes / 1440)}d</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold capitalize">{type}s</h2>
          <p className="text-muted-foreground">
            Manage your automation {type}s
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${type}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            {type === 'webhook' ? (
              <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            ) : (
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold mb-2">
              No {type}s found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `No ${type}s match your search criteria.`
                : `Create your first ${type} to get started with automation.`
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                Create {type === 'webhook' ? 'Webhook' : 'Schedule'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {type === 'webhook' ? (
                  <>
                    <TableHead>Entity/Operation</TableHead>
                    <TableHead>URL</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Cron Expression</TableHead>
                    <TableHead>Next Run</TableHead>
                  </>
                )}
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {type === 'webhook' ? (
                    <>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getEntityTypeBadge(item.entityType)}
                          {getOperationBadge(item.operation)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-xs">
                            {item.webhookUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(item.webhookUrl, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <div className="space-y-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.cronExpression}
                          </code>
                          {item.scheduleDescription && (
                            <div className="text-xs text-muted-foreground">
                              {item.scheduleDescription}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.nextRunAt && (
                            <>
                              <div className="text-sm">
                                {formatDate(item.nextRunAt)}
                              </div>
                              {getNextRunStatus(item)}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </>
                  )}
                  
                  <TableCell>
                    {getStatusBadge(item.active)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleToggle(item.id, item.active)}>
                          {item.active ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        {type === 'schedule' && (
                          <DropdownMenuItem onClick={() => handleExecuteSchedule(item.id)}>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Execute Now
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirm(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-800">Confirm Deletion</p>
                <p className="text-red-700">
                  This action cannot be undone. The {type} will be permanently deleted.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Forms */}
      {showForm && (
        <>
          {type === 'webhook' ? (
            <WebhookForm
              webhook={selectedItem}
              onClose={() => {
                setShowForm(false);
                setSelectedItem(null);
              }}
              onSuccess={() => {
                setShowForm(false);
                setSelectedItem(null);
                onRefresh();
              }}
            />
          ) : (
            <ScheduleForm
              schedule={selectedItem}
              onClose={() => {
                setShowForm(false);
                setSelectedItem(null);
              }}
              onSuccess={() => {
                setShowForm(false);
                setSelectedItem(null);
                onRefresh();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
