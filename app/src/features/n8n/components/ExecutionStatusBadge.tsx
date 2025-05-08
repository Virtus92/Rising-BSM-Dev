'use client';

import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

/**
 * Component for displaying workflow execution status with appropriate styling
 */
export interface ExecutionStatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting' | string;
  className?: string;
  showIcon?: boolean;
}

export const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({ 
  status, 
  className = '',
  showIcon = true
}) => {
  let icon = null;
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
  let label = status;
  
  // Determine styling based on status
  switch (status) {
    case 'pending':
      icon = showIcon ? <Clock className="h-3.5 w-3.5 mr-1" /> : null;
      variant = 'outline';
      label = 'Pending';
      break;
      
    case 'waiting':
      icon = showIcon ? <Clock className="h-3.5 w-3.5 mr-1" /> : null;
      variant = 'outline';
      label = 'Waiting';
      break;
      
    case 'running':
      icon = showIcon ? <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> : null;
      variant = 'secondary';
      label = 'Running';
      break;
      
    case 'completed':
    case 'success':
      icon = showIcon ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : null;
      variant = 'default'; // Using the default primary color for success
      label = 'Completed';
      break;
      
    case 'failed':
    case 'error':
      icon = showIcon ? <XCircle className="h-3.5 w-3.5 mr-1" /> : null;
      variant = 'destructive';
      label = 'Failed';
      break;
      
    default:
      icon = showIcon ? <AlertTriangle className="h-3.5 w-3.5 mr-1" /> : null;
      variant = 'outline';
      label = status;
  }
  
  return (
    <Badge variant={variant} className={`font-normal ${className}`}>
      {icon}
      {label}
    </Badge>
  );
};