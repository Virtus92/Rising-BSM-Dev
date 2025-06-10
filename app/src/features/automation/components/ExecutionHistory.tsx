'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
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
import { 
  CircleCheckBig, 
  CircleX, 
  Clock, 
  Ellipsis, 
  RefreshCw, 
  Search,
  Filter,
  Activity,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Eye
} from 'lucide-react';
import { useAutomation } from '../hooks/useAutomation';

interface ExecutionHistoryProps {
  executions?: any[];
  compact?: boolean;
}

export function ExecutionHistory({ executions: propExecutions, compact = false }: ExecutionHistoryProps) {
  const { executions: hookExecutions, retryExecution, fetchExecutions, loading } = useAutomation();
  
  const executions = propExecutions || hookExecutions;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  // Filter executions
  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.id.toString().includes(searchTerm) ||
                         execution.automationId.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    const matchesType = typeFilter === 'all' || execution.automationType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRetry = async (executionId: string) => {
    try {
      await retryExecution(executionId);
      if (fetchExecutions) {
        fetchExecutions();
      }
    } catch (error) {
      console.error('Error retrying execution:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CircleCheckBig className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <CircleX className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, "default" | "destructive" | "outline" | "secondary" | "success" | "warning" | "info"> = {
      success: 'success',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    };
    
    return (
      <Badge variant={variantMap[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getExecutionTimeColor = (timeMs: number) => {
    if (timeMs < 1000) return 'text-green-600';
    if (timeMs < 5000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return compact 
      ? d.toLocaleTimeString()
      : d.toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getResponseStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {executions.slice(0, 5).map((execution) => (
          <div key={execution.id} className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-3">
              {getStatusIcon(execution.status)}
              <div>
                <div className="text-sm font-medium">
                  {execution.automationType} #{execution.automationId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(execution.executedAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {execution.executionTimeMs && (
                <span className={`text-xs ${getExecutionTimeColor(execution.executionTimeMs)}`}>
                  {formatDuration(execution.executionTimeMs)}
                </span>
              )}
              {getStatusBadge(execution.status)}
            </div>
          </div>
        ))}
        
        {executions.length === 0 && (
          <div className="text-center text-muted-foreground py-6">
            No executions found
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Execution History</h2>
          <p className="text-muted-foreground">
            Monitor automation execution results and performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => fetchExecutions && fetchExecutions()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Executions Table */}
      <Card>
        {filteredExecutions.length === 0 ? (
          <CardContent className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No executions found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No executions match your filter criteria.'
                : 'Executions will appear here once automations start running.'
              }
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Executed At</TableHead>
                <TableHead>Retry</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExecutions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <code className="text-sm">#{execution.id}</code>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {execution.automationType}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>#{execution.automationId}</span>
                      {execution.entityId && (
                        <Badge variant="outline" className="text-xs">
                          {execution.entityType}:{execution.entityId}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(execution.status)}
                      {getStatusBadge(execution.status)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {execution.responseStatus && (
                      <div className="space-y-1">
                        <Badge 
                          variant="outline" 
                          className={getResponseStatusColor(execution.responseStatus)}
                        >
                          {execution.responseStatus}
                        </Badge>
                        {execution.errorMessage && (
                          <div className="text-xs text-red-600 truncate max-w-xs">
                            {execution.errorMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {execution.executionTimeMs && (
                      <span className={`text-sm ${getExecutionTimeColor(execution.executionTimeMs)}`}>
                        {formatDuration(execution.executionTimeMs)}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(execution.executedAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {execution.retryAttempt > 0 && (
                      <Badge variant="outline">
                        Retry {execution.retryAttempt}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Ellipsis className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => setSelectedExecution(execution)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        
                        {execution.status === 'failed' && (
                          <DropdownMenuItem onClick={() => handleRetry(execution.id)}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry
                          </DropdownMenuItem>
                        )}
                        
                        {execution.responseBody && (
                          <DropdownMenuItem 
                            onClick={() => {
                              const blob = new Blob([execution.responseBody], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Response
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Execution Details Modal */}
      {selectedExecution && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Execution Details</CardTitle>
                <CardDescription>
                  Execution #{selectedExecution.id} - {selectedExecution.automationType}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedExecution(null)}>
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(selectedExecution.status)}
                    {getStatusBadge(selectedExecution.status)}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Execution Time</Label>
                  <div className="mt-1">
                    {selectedExecution.executionTimeMs && (
                      <span className={`text-sm ${getExecutionTimeColor(selectedExecution.executionTimeMs)}`}>
                        {formatDuration(selectedExecution.executionTimeMs)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Response Status</Label>
                  <div className="mt-1">
                    {selectedExecution.responseStatus && (
                      <Badge 
                        variant="outline" 
                        className={getResponseStatusColor(selectedExecution.responseStatus)}
                      >
                        {selectedExecution.responseStatus}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Executed At</Label>
                  <div className="text-sm mt-1">
                    {formatDate(selectedExecution.executedAt)}
                  </div>
                </div>
              </div>
              
              {selectedExecution.errorMessage && (
                <div>
                  <Label className="text-sm font-medium">Error Message</Label>
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-1">
                    <code className="text-sm text-red-800">
                      {selectedExecution.errorMessage}
                    </code>
                  </div>
                </div>
              )}
              
              {selectedExecution.responseBody && (
                <div>
                  <Label className="text-sm font-medium">Response Body</Label>
                  <pre className="bg-muted rounded p-3 mt-1 text-sm overflow-x-auto">
                    {selectedExecution.responseBody}
                  </pre>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className: string }) {
  return <div className={className}>{children}</div>;
}
