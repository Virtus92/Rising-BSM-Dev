'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  RefreshCw, 
  Filter,
  Search,
  AlertTriangle,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  FileJson
} from 'lucide-react';
import { useExecutions } from '../hooks/useExecutions';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

/**
 * Execution history tab component
 */
export const ExecutionsTab: React.FC = () => {
  const { 
    executions, 
    loading, 
    error,
    filters,
    totalCount,
    totalPages,
    page,
    setPage,
    setFilters,
    fetchExecutions
  } = useExecutions();
  
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showJsonModal, setShowJsonModal] = useState<string | null>(null);
  
  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery });
    setPage(1);
  };
  
  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status });
    setPage(1);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Workflow Execution History</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchExecutions()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md border border-destructive/20">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search executions..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={filters.status || 'all'} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="secondary" size="icon" disabled>
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
      
      {/* Execution Table */}
      {loading ? (
        <div className="border rounded-md p-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={`skeleton-row-${i}`} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : executions.length === 0 ? (
        <div className="py-8 text-center border rounded-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No execution history found</h3>
          <p className="text-muted-foreground mt-1">
            {filters.status || filters.search 
              ? 'Try changing your filters or search query' 
              : 'Trigger workflows to see their execution history here'}
          </p>
        </div>
      ) : (
        <div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-mono text-xs">
                      {execution.externalId}
                    </TableCell>
                    <TableCell>
                      {execution.workflowTemplate?.name || 'Direct Execution'}
                    </TableCell>
                    <TableCell>
                      <TriggerTypeBadge type={execution.triggerType} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={execution.status} />
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{formatDate(execution.startedAt, true)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {formatDate(execution.startedAt, false)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {execution.completedAt 
                        ? formatDuration(new Date(execution.startedAt), new Date(execution.completedAt))
                        : execution.status === 'running' 
                          ? formatDuration(new Date(execution.startedAt), new Date()) + '...'
                          : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowJsonModal(execution.id)}
                        >
                          <FileJson className="h-4 w-4" />
                        </Button>
                        
                        {execution.externalId && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  // This would open in the N8N interface
                                  // onClick={() => window.open(`${n8nUrl}/execution/${execution.externalId}`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                View in n8n
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, totalCount)} of {totalCount} executions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* TODO: Implement JSON view modal */}
      {/* {showJsonModal && (
        <JsonViewModal 
          executionId={showJsonModal} 
          onClose={() => setShowJsonModal(null)} 
        />
      )} */}
    </div>
  );
};

/**
 * Badge component for displaying execution status
 */
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="font-normal">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'running':
      return (
        <Badge variant="secondary" className="font-normal">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="success" className="font-normal">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="font-normal">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-normal">
          {status}
        </Badge>
      );
  }
};

/**
 * Badge component for displaying trigger type
 */
interface TriggerTypeBadgeProps {
  type: string;
}

const TriggerTypeBadge: React.FC<TriggerTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'manual':
      return (
        <Badge variant="outline" className="font-normal bg-blue-50">
          Manual
        </Badge>
      );
    case 'webhook':
      return (
        <Badge variant="outline" className="font-normal bg-purple-50">
          Webhook
        </Badge>
      );
    case 'event':
      return (
        <Badge variant="outline" className="font-normal bg-green-50">
          Event
        </Badge>
      );
    case 'scheduled':
      return (
        <Badge variant="outline" className="font-normal bg-amber-50">
          <Calendar className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-normal">
          {type}
        </Badge>
      );
  }
};

/**
 * Format a date for display
 */
function formatDate(dateString: string, short: boolean = false): string {
  const date = new Date(dateString);
  
  if (short) {
    // For today, just show time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // For this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show short date
    return date.toLocaleDateString([], { year: '2-digit', month: 'short', day: 'numeric' });
  }
  
  // Full date and time
  return date.toLocaleString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format a duration between two dates
 */
function formatDuration(start: Date, end: Date): string {
  const durationMs = end.getTime() - start.getTime();
  
  // Less than a minute
  if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000)}s`;
  }
  
  // Less than an hour
  if (durationMs < 3600000) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  
  // Hours and minutes
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}