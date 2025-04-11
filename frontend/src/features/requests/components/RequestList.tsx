"use client";

import React from 'react';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Eye 
} from 'lucide-react';
import { useRequests } from '../hooks/useRequests';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';

export const RequestList = () => {
  const { requests, isLoading, error, deleteRequest } = useRequests();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
        <p className="font-semibold mb-2">Error loading requests</p>
        <p>{error}</p>
        <p className="text-sm mt-2">Please check your connection and try again later.</p>
      </div>
    );
  }
  
  // Check if requests is an array and has items
  const requestsArray = Array.isArray(requests) ? requests : [];
  
  if (requestsArray.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border border-dashed rounded-md">
        <p className="mb-2">No requests found.</p>
        <p className="text-sm">Requests are created when customers contact you through the contact form.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requestsArray.map((request) => (
        <TableRow key={request.id}>
        <TableCell>{request.id}</TableCell>
        <TableCell>{request.name}</TableCell>
        <TableCell>{request.service}</TableCell>
        <TableCell>
        <Badge 
        variant={
        request.status === RequestStatus.COMPLETED ? 'default' : 
        request.status === RequestStatus.NEW ? 'secondary' : 
        'destructive'
        }
        >
        {request.status}
        </Badge>
        </TableCell>
        <TableCell>
        {new Date(request.createdAt).toLocaleDateString()}
        </TableCell>
        <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
        <Button 
        variant="outline" 
        size="icon" 
        title="View Details"
        >
        <Eye className="h-4 w-4" />
        </Button>
        <Button 
        variant="outline" 
        size="icon" 
        title="Edit Request"
        >
        <Edit className="h-4 w-4" />
        </Button>
        <Button 
        variant="destructive" 
        size="icon" 
        title="Delete Request"
        onClick={() => deleteRequest(Number(request.id))}
        >
        <Trash2 className="h-4 w-4" />
        </Button>
        </div>
        </TableCell>
        </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};