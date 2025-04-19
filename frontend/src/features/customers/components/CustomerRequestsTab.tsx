import { useState, useEffect } from 'react';
import { MessageSquare, User, Loader2, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { formatDate } from '@/shared/utils/date-utils';
import { RequestService } from '@/infrastructure/clients/RequestService';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import Link from 'next/link';

interface CustomerRequestsTabProps {
  customerId: number;
}

export const CustomerRequestsTab: React.FC<CustomerRequestsTabProps> = ({ customerId }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch requests specifically for this customer
      const response = await RequestService.getRequests({
        customerId: customerId,
        limit: 50,
        page: 1,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      });
      
      if (response.success && response.data) {
        setRequests(response.data.data || []);
      } else {
        setError(response.message || 'Failed to load customer requests');
      }
    } catch (err) {
      console.error('Error fetching customer requests:', err);
      setError(typeof err === 'string' ? err : 'An error occurred while loading requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [customerId]);

  const handleManualRefresh = () => {
    fetchRequests(true);
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      );
    }
    
    switch (status) {
      case RequestStatus.NEW:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
            New
          </Badge>
        );
      case RequestStatus.IN_PROGRESS:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
            In Progress
          </Badge>
        );
      case RequestStatus.COMPLETED:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            Completed
          </Badge>
        );
      case RequestStatus.CANCELLED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
            Customer Requests
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <CardDescription>
          Contact requests and inquiries from this customer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-center">
            <p>Error loading requests: {error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Requests Available</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              This customer hasn't made any requests yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{request?.service || 'General Inquiry'}</h4>
                        {getStatusBadge(request?.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {request?.createdAt ? formatDate(request.createdAt) : 'Unknown date'}
                        </span>
                      </p>
                    </div>
                    <Link href={`/dashboard/requests/${request?.id || 0}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <span className="text-xs">View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm line-clamp-2 mt-2">{request?.message || 'No details provided'}</p>
                </div>
                
                {request?.appointmentId && (
                  <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-b-md">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Has appointment
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {requests.length > 0 && (
        <CardFooter className="bg-gray-50 dark:bg-gray-800/50 flex justify-center border-t py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};