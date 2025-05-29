'use client';

import React, { useEffect, useState } from 'react';
import { getLogger } from '@/core/logging';
import { useRouter } from 'next/navigation';
import { 
  FileText,
  RefreshCw, 
  Phone,
  Mail,
  UserPlus, 
  MessageSquare, 
  Check,
  X, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import RequestClient from '@/features/requests/lib/clients/RequestClient';
import { PermissionGuard } from '@/shared/components/PermissionGuard';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { useToast } from '@/shared/hooks/useToast';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';

/**
 * Enum representing different process steps in the request handling workflow
 */
enum ProcessStep {
  NONE,
  INFO_REVIEW,
  CONTACT_INFO,
  CUSTOMER_CONVERSION,
  SUCCESS
}

/**
 * NewRequests Component
 * 
 * Displays recent service requests with user-friendly action buttons
 * and clean layout for optimal usability. Includes a multi-step process flow
 * for handling new customer requests.
 */
export const NewRequests = () => {
  // Initialize logger
  const logger = getLogger();
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);
  
  // Process flow state
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [activeRequest, setActiveRequest] = useState<RequestResponseDto | null>(null);
  const [processStep, setProcessStep] = useState<ProcessStep>(ProcessStep.NONE);
  const [processingNote, setProcessingNote] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | ''>('');
  
  // Customer list for dropdown
  const [customers, setCustomers] = useState<Array<{id: number, name: string}>>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  
  // Add Note dialog state
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [noteRequestId, setNoteRequestId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  
  // Status change dialog state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusRequestId, setStatusRequestId] = useState<number | null>(null);
  
  // Add permission check
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canViewRequests = hasPermission(API_PERMISSIONS.REQUESTS.VIEW);
  
  // Load requests on component mount with improved initialization coordination
  useEffect(() => {
    // Skip if permissions are still loading or user doesn't have permission
    if (permissionsLoading || !canViewRequests) {
      if (!permissionsLoading && !canViewRequests) {
        setIsLoading(false); // Mark as not loading if we don't have permission
      }
      return;
    }
    
    let isComponentMounted = true;
    let eventListener: (() => void) | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    
    // Prevent duplicate initialization - track in module scope
    if (typeof window !== 'undefined' && !(window as any).__DASHBOARD_REQUESTS_INITIALIZED) {
      (window as any).__DASHBOARD_REQUESTS_INITIALIZED = true;
    }
    
    // Use a debounced fetch to prevent rapid multiple calls
    const debouncedFetch = (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      return (showLoading = true) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (isComponentMounted) {
            fetchRequests(showLoading);
          }
          timeoutId = null;
        }, 300); // 300ms debounce delay
      };
    })();
    
    // Function to handle API client init
    const initializeAndFetch = async () => {
      try {
        const { ApiClient } = await import('@/core/api/ApiClient');
        
        // Only initialize if needed and component is still mounted
        if (!isComponentMounted) return;
        
        // Ensure ApiClient is initialized before proceeding
        if (!ApiClient.isInitialized()) {
          logger.debug('ApiClient not initialized, initializing now in NewRequests');
          await ApiClient.initialize();
        }
        
        // Fetch data if component is still mounted
        if (isComponentMounted) {
          debouncedFetch();
          
          // Set up refresh interval
          intervalId = setInterval(() => {
            if (isComponentMounted) {
              debouncedFetch(false);
            }
          }, 5 * 60 * 1000);
        }
      } catch (error) {
        logger.error('Error initializing API client:', error as Error);
        setError('Failed to initialize API client. Please refresh the page.');
      }
    };
    
    // Start initialization sequence with improved event handling
    const handleApiInitialized = (event?: Event) => {
      if (isComponentMounted) {
        // Check if the API was successfully initialized from event
        const detail = (event as CustomEvent)?.detail;
        if (detail && !detail.success) {
          logger.warn('API initialization event received but initialization failed');
          return;
        }
        
        logger.debug('API initialization event received, fetching requests');
        debouncedFetch();
      }
    };
    
    // Listen for API initialization event
    window.addEventListener('api-client-initialized', handleApiInitialized);
    eventListener = handleApiInitialized;
    
    // Check if API is already initialized
    const checkApiInitialization = async () => {
      try {
        const { ApiClient } = await import('@/core/api/ApiClient');
        if (ApiClient.isInitialized()) {
          logger.debug('API Client already initialized, fetching immediately');
          handleApiInitialized();
        } else {
          // Start initialization process
          initializeAndFetch();
        }
      } catch (error) {
        logger.error('Error checking API initialization:', error as Error);
        // Start initialization as fallback
        initializeAndFetch();
      }
    };
    
    // Begin the process
    checkApiInitialization();
    
    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (eventListener) {
        window.removeEventListener('api-client-initialized', eventListener);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [canViewRequests, permissionsLoading]);

  // Load request details when activeRequestId changes
  useEffect(() => {
    if (activeRequestId && processStep !== ProcessStep.NONE) {
      fetchRequestDetails(activeRequestId);
    }
  }, [activeRequestId]);

  // Load customers when conversion dialog opens
  useEffect(() => {
    if (processStep === ProcessStep.CUSTOMER_CONVERSION) {
      fetchCustomers();
    }
  }, [processStep]);
  
  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      // Import the CustomerClient
      const { default: CustomerClient } = await import('@/features/customers/lib/clients/CustomerClient');
      const response = await CustomerClient.getCustomers({ 
        limit: 20, 
        sortBy: 'name',
        sortDirection: 'asc'
      });
      
      if (response.success && response.data) {
        // Extract customer data from response
        let customerList: any[] = [];
        if (Array.isArray(response.data)) {
          customerList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customerList = response.data.data;
        }
        
        setCustomers(customerList.map(customer => ({
          id: customer.id,
          name: customer.name
        })));
      } else {
        console.error('Failed to load customers:', response.error || 'Unknown error');
        toast({
          title: 'Error',
          description: 'Failed to load customers. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  // Fetch requests from API with robust authentication handling
  const fetchRequests = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null); // Clear any existing errors before fetching
    
    try {
      // Import auth service and API client for potential token refresh
      const { default: AuthService } = await import('@/features/auth/core/AuthService');
      const { ApiClient } = await import('@/core/api/ApiClient');
      
      // Ensure proper initialization with retry
      if (!ApiClient.isInitialized()) {
        logger.debug('API Client not initialized, initializing before fetch');
        const initResult = await ApiClient.initialize();
        
        if (!initResult) {
          logger.error('API Client initialization failed before fetch');
          setError('API Client initialization failed. Please refresh the page.');
          setIsLoading(false);
          return;
        }
      }
      
      // Try to get requests
      logger.debug('Fetching new requests...');
      const response = await RequestClient.getRequests({
        status: RequestStatus.NEW,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        limit: 5
      });

      //Process the response
      logger.debug('API Response:', response);
      
      // Check for auth errors (401) and try to refresh token
      if (!response.success && response.statusCode === 401) {
        logger.info('API Request returned 401, attempting token refresh');
        
        // Try to refresh token
        const refreshResult = await AuthService.refreshToken();
        
        if (refreshResult.success) {
          logger.info('Token refreshed, retrying request');
          
          // Small delay to ensure token propagation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Retry the request with fresh token
          const retryResponse = await RequestClient.getRequests({
            status: RequestStatus.NEW,
            sortBy: 'createdAt',
            sortDirection: 'desc',
            limit: 5
          });
          
          // If retry succeeds, use its response instead
          if (retryResponse.success) {
            logger.info('Retry successful after token refresh');
            processResponse(retryResponse);
            return;
          } else {
            // If retry still fails, report the error
            logger.warn('API Client Error', {
              message: retryResponse.error ? String(retryResponse.error) : 'Authentication required',
              code: retryResponse.statusCode ? Number(retryResponse.statusCode) : 500,
              status: retryResponse.statusCode ? Number(retryResponse.statusCode) : 500
            });
            
            setError('Authentication required. Please refresh the page or log in again.');
          }
        } else {
          // Token refresh failed
          logger.warn('Token refresh failed, authentication required');
          setError('Your session has expired. Please refresh the page or log in again.');
        }
      } else if (response.success) {
        // Process successful response
        processResponse(response);
      } else {
        // Other errors
        logger.error('Request fetch failed:', response.error ? String(response.error) : (response.message ? String(response.message) : 'Unknown error'));
        setError(response.error || response.message || 'Failed to load requests');
      }
    } catch (err) {
      console.error('Error fetching requests:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'An error occurred while loading requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch request details for the active request
  const fetchRequestDetails = async (requestId: number) => {
    try {
      setIsActionLoading(requestId);
      const response = await RequestClient.getRequestById(requestId);
      
      if (response.success && response.data) {
        setActiveRequest(response.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load request details. Please try again.',
          variant: 'destructive'
        });
        resetProcessFlow();
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load request details. Please try again.',
        variant: 'destructive'
      });
      resetProcessFlow();
    } finally {
      setIsActionLoading(null);
    }
  };
  
  // Process API response and extract request data
  const processResponse = (response: any) => {
    // Handle different response formats
    if (Array.isArray(response.data)) {
      // Direct array format
      setRequests(response.data);
    } else if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
      // Nested data.data array format (matches the expected API response)
      setRequests(response.data.data);
    } else if (!response.data) {
      // Handle empty data case gracefully
      console.log('No request data available');
      setRequests([]);
    } else if (response.data && typeof response.data === 'object' && response.data !== null) {
      // Handle other possible response formats
      const typedData = response.data as Record<string, unknown>;
      
      if ('items' in typedData && Array.isArray(typedData.items)) {
        setRequests(typedData.items as RequestResponseDto[]);
      } else if ('results' in typedData && Array.isArray(typedData.results)) {
        setRequests(typedData.results as RequestResponseDto[]);
      } else {
        // Try to extract request-like objects from data
        const possibleRequests = Object.values(typedData)
          .filter(item => 
            item && 
            typeof item === 'object' && 
            item !== null &&
            'id' in (item as object) && 
            'name' in (item as object)
          );
        
        if (possibleRequests.length > 0) {
          setRequests(possibleRequests as RequestResponseDto[]);
        } else {
          console.warn('Unable to locate requests in response format:', response);
          setError('Invalid response format - please check browser console');
        }
      }
    } else {
      console.warn('Invalid response format:', response);
      setError('Invalid response format - please check browser console');
    }
  };

  // Handle view request details
  const handleViewRequest = (requestId: number) => {
    router.push(`/dashboard/requests/${requestId}`);
  };
  
  // Start the request processing flow
  const handleStartProcess = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setActiveRequestId(requestId);
    setProcessStep(ProcessStep.INFO_REVIEW);
    setProcessingNote('');
    setSelectedCustomerId(null);
    setSelectedStatus('');
  };

  // Open note dialog
  const handleOpenNoteDialog = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteRequestId(requestId);
    setNoteText('');
    setIsAddNoteDialogOpen(true);
  };

  // Open status change dialog
  const handleOpenStatusDialog = (requestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusRequestId(requestId);
    setSelectedStatus('');
    setIsStatusDialogOpen(true);
  };

  // Add a note to the request
  const handleAddNote = async () => {
    if (!noteRequestId || !noteText.trim()) return;
    
    setIsActionLoading(noteRequestId);
    
    try {
      const response = await RequestClient.addNote(noteRequestId, noteText);
      
      if (response.success) {
        toast({
          title: 'Note added',
          description: 'Note has been added successfully',
          variant: 'success'
        });
        setIsAddNoteDialogOpen(false);
        setNoteText('');
        setNoteRequestId(null);
        
        // Refresh request list
        fetchRequests(false);
      } else {
        toast({
          title: 'Failed to add note',
          description: response.message || 'An error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  // Add a process note in the workflow
  const handleAddProcessNote = async () => {
    if (!activeRequestId || !processingNote.trim()) return;
    
    setIsActionLoading(activeRequestId);
    
    try {
      const response = await RequestClient.addNote(activeRequestId, processingNote);
      
      if (response.success) {
        toast({
          title: 'Note added',
          description: 'Note has been added successfully',
          variant: 'success'
        });
        setProcessingNote('');
        
        // Refresh request details
        fetchRequestDetails(activeRequestId);
      } else {
        toast({
          title: 'Failed to add note',
          description: response.message || 'An error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  // Link request to a customer
  const handleLinkToCustomer = async () => {
    if (!activeRequestId || !selectedCustomerId) return;
    
    setIsActionLoading(activeRequestId);
    
    try {
      const response = await RequestClient.linkToCustomer(
        activeRequestId, 
        selectedCustomerId, 
        processingNote || 'Request linked to customer'
      );
      
      if (response.success) {
        toast({
          title: 'Request linked',
          description: 'Request has been linked to the customer',
          variant: 'success'
        });
        
        // Move to success step
        setProcessStep(ProcessStep.SUCCESS);
        
        // Refresh request list in the background
        fetchRequests(false);
      } else {
        toast({
          title: 'Failed to link request',
          description: response.message || 'An error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error linking request to customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to link request to customer. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  // Convert request to a new customer
  const handleConvertToCustomer = async () => {
    if (!activeRequestId || !activeRequest) return;
    
    setIsActionLoading(activeRequestId);
    
    try {
      const response = await RequestClient.convertToCustomer(
        activeRequestId, 
        {
          requestId: activeRequestId,
          customerData: {
            name: activeRequest.name,
            email: activeRequest.email,
            phone: activeRequest.phone || '',
          },
          note: processingNote || 'Converted from request'
        }
      );
      
      if (response.success) {
        toast({
          title: 'Request converted',
          description: 'Request has been converted to a customer',
          variant: 'success'
        });
        
        if (response.data?.customerId) {
          setSelectedCustomerId(response.data.customerId);
        }
        
        // Move to success step
        setProcessStep(ProcessStep.SUCCESS);
        
        // Refresh request list in the background
        fetchRequests(false);
      } else {
        toast({
          title: 'Failed to convert request',
          description: response.message || 'An error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error converting request to customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert request to customer. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  // Handle status change from modal
  const handleStatusChange = async () => {
    if (!statusRequestId || !selectedStatus) return;
    
    setIsActionLoading(statusRequestId);
    
    try {
      const response = await RequestClient.updateStatus(
        statusRequestId, 
        { 
          status: selectedStatus as RequestStatus,
        }
      );
      
      if (response.success) {
        toast({
          title: 'Status updated',
          description: `Request status has been updated to ${selectedStatus}`,
          variant: 'success'
        });
        
        setIsStatusDialogOpen(false);
        setStatusRequestId(null);
        setSelectedStatus('');
        
        // Refresh request list
        fetchRequests(false);
      } else {
        toast({
          title: 'Failed to update status',
          description: response.message || 'An error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  // Go to the next step in the process flow
  const handleNextStep = () => {
    if (processStep === ProcessStep.INFO_REVIEW) {
      setProcessStep(ProcessStep.CUSTOMER_CONVERSION);
    } else if (processStep === ProcessStep.CONTACT_INFO) {
      setProcessStep(ProcessStep.CUSTOMER_CONVERSION);
    }
  };

  // Handle when need more information is confirmed
  const handleNeedMoreInfo = () => {
    setProcessStep(ProcessStep.CONTACT_INFO);
  };

  // Navigate to customer page 
  const handleGoToCustomer = () => {
    if (selectedCustomerId) {
      resetProcessFlow();
      router.push(`/dashboard/customers/${selectedCustomerId}`);
    } else if (activeRequest?.customerId) {
      resetProcessFlow();
      router.push(`/dashboard/customers/${activeRequest.customerId}`);
    } else {
      resetProcessFlow();
      router.push(`/dashboard/customers`);
    }
  };

  // Reset the process flow state
  const resetProcessFlow = () => {
    setActiveRequestId(null);
    setActiveRequest(null);
    setProcessStep(ProcessStep.NONE);
    setProcessingNote('');
    setSelectedCustomerId(null);
    setSelectedStatus('');
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge based on request status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case RequestStatus.IN_PROGRESS:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">In Progress</Badge>;
      case RequestStatus.COMPLETED:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Completed</Badge>;
      case RequestStatus.CANCELLED:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Cancelled</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">New</Badge>;
    }
  };

  // If the user doesn't have permission, don't render anything
  if (!permissionsLoading && !canViewRequests) {
    return null;
  }

  // Still loading permissions state
  if (permissionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            Neue Anfragen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Regular loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            New Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            New Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h4 className="text-red-800 dark:text-red-300 font-medium">Error loading requests</h4>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => fetchRequests()}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (requests.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            New Requests
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchRequests()}
            className="h-8 w-8 p-0"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full mb-3">
            <FileText className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Keine neuen Anfragen</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Alle Anfragen wurden bearbeitet. Neue Anfragen werden hier angezeigt.
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/requests')}
            className="flex items-center"
          >
            Alle Anfragen anzeigen
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Normal state with requests
  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-500" />
            New Requests
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchRequests()}
              className="h-9 w-9 p-0 flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {requests.map((request) => (
              <div 
                key={request.id} 
                onClick={() => handleViewRequest(request.id)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 p-4 cursor-pointer transition-colors"
              >
                {/* Request info */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-sm md:text-base text-slate-900 dark:text-white flex items-center gap-2">
                      {request.name}
                      {getStatusBadge(request.status)}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {request.service || 'Service Request'}
                    </p>
                  </div>
                  <div className="text-xs text-right">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(request.createdAt)}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {formatTime(request.createdAt)}
                    </div>
                  </div>
                </div>
                
                {/* Message preview */}
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {request.message}
                  </p>
                </div>
                
                {/* Action buttons - all three buttons are shown at the same level */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {isActionLoading === request.id ? (
                    <div className="w-full flex items-center justify-center py-2">
                      <Loader2 className="h-5 w-5 text-purple-500 animate-spin mr-2" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Processing...</span>
                    </div>
                  ) : (
                    <>
                      <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="h-9 px-3 border-blue-200 hover:border-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
                          onClick={(e) => handleStartProcess(request.id, e)}
                        >
                          <Play className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1.5" />
                          <span className="text-blue-600 dark:text-blue-400">Start</span>
                        </Button>
                      </PermissionGuard>
                      
                      <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="h-9 px-3 border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-700"
                          onClick={(e) => handleOpenNoteDialog(request.id, e)}
                        >
                          <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-1.5" />
                          <span className="text-amber-600 dark:text-amber-400">Add Note</span>
                        </Button>
                      </PermissionGuard>
                      
                      <PermissionGuard permission={SystemPermission.REQUESTS_EDIT}>
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="h-9 px-3 border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700"
                          onClick={(e) => handleOpenStatusDialog(request.id, e)}
                        >
                          <ChevronDown className="h-4 w-4 text-green-600 dark:text-green-400 mr-1.5" />
                          <span className="text-green-600 dark:text-green-400">Change Status</span>
                        </Button>
                      </PermissionGuard>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 text-center border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="link" 
              onClick={() => router.push('/dashboard/requests')}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center mx-auto"
            >
              Alle Anfragen anzeigen
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Info Review Dialog */}
      <Dialog open={processStep === ProcessStep.INFO_REVIEW} onOpenChange={(isOpen) => !isOpen && resetProcessFlow()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Information</DialogTitle>
            <DialogDescription>
              Review the request information before proceeding
            </DialogDescription>
          </DialogHeader>
          
          {activeRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-500">Name</Label>
                  <div className="font-medium">{activeRequest.name}</div>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Service</Label>
                  <div className="font-medium">{activeRequest.service}</div>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Email</Label>
                  <div className="font-medium">{activeRequest.email}</div>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Phone</Label>
                  <div className="font-medium">{activeRequest.phone || 'Not provided'}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-slate-500">Message</Label>
                  <div className="mt-1 text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    {activeRequest.message}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-slate-500">Created</Label>
                  <div className="font-medium">
                    {formatDate(activeRequest.createdAt)} at {formatTime(activeRequest.createdAt)}
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-4">
                <h3 className="font-medium text-lg mb-2">Do you need more information?</h3>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={handleNeedMoreInfo}>
                    Yes, contact customer
                  </Button>
                  <Button onClick={handleNextStep}>
                    No, continue processing
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 2: Contact Information Dialog */}
      <Dialog open={processStep === ProcessStep.CONTACT_INFO} onOpenChange={(isOpen) => !isOpen && resetProcessFlow()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
            <DialogDescription>
              Use the contact details below to reach out to the customer
            </DialogDescription>
          </DialogHeader>
          
          {activeRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md space-y-3">
                  <div>
                    <Label className="text-sm text-slate-500">Customer Name</Label>
                    <div className="font-medium">{activeRequest.name}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-500">Email</Label>
                      <div className="flex items-center mt-1">
                        <span className="font-medium mr-2">{activeRequest.email}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => window.open(`mailto:${activeRequest.email}?subject=Regarding your ${activeRequest.service} request`)}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1" />
                          Send Email
                        </Button>
                      </div>
                    </div>
                    
                    {activeRequest.phone && (
                      <div>
                        <Label className="text-sm text-slate-500">Phone</Label>
                        <div className="flex items-center mt-1">
                          <span className="font-medium mr-2">{activeRequest.phone}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => window.open(`tel:${activeRequest.phone}`)}
                          >
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            Call
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm text-slate-500">Service</Label>
                    <div className="font-medium">{activeRequest.service}</div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-slate-500">Message</Label>
                    <div className="mt-1 text-sm p-3 bg-white dark:bg-slate-700 rounded-md">
                      {activeRequest.message}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="processingNote">Add Note</Label>
                  <Textarea 
                    id="processingNote" 
                    placeholder="Add notes about your contact with the customer"
                    value={processingNote}
                    onChange={(e) => setProcessingNote(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter className="flex justify-between items-center">
                <Button 
                  variant="outline"
                  onClick={handleAddProcessNote}
                  disabled={!processingNote.trim() || isActionLoading === activeRequestId}
                >
                  {isActionLoading === activeRequestId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Note'
                  )}
                </Button>
                <Button onClick={handleNextStep}>
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 3: Customer Conversion Dialog */}
      <Dialog open={processStep === ProcessStep.CUSTOMER_CONVERSION} onOpenChange={(isOpen) => !isOpen && resetProcessFlow()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Convert to Customer</DialogTitle>
            <DialogDescription>
              Link this request to an existing customer or create a new customer
            </DialogDescription>
          </DialogHeader>
          
          {activeRequest && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-500">Name</Label>
                  <div className="font-medium">{activeRequest.name}</div>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Email</Label>
                  <div className="font-medium">{activeRequest.email}</div>
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="customerId">Link to Existing Customer</Label>
                  <div className="flex gap-3 mt-1">
                    <Select 
                      value={selectedCustomerId?.toString() || ""} 
                      onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
                      disabled={isLoadingCustomers}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCustomers ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading customers...</span>
                          </div>
                        ) : customers.length > 0 ? (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-sm">No customers found</div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleLinkToCustomer}
                      disabled={!selectedCustomerId || isLoadingCustomers}
                    >
                      Link Customer
                    </Button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-slate-500 mb-2">Or create a new customer from this request</p>
                  <Button
                    onClick={handleConvertToCustomer}
                    variant="outline"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convert to New Customer
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="processingNote">Add Note</Label>
                  <Textarea 
                    id="processingNote" 
                    placeholder="Add processing notes"
                    value={processingNote}
                    onChange={(e) => setProcessingNote(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                  {processingNote.trim() && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleAddProcessNote}
                      disabled={isActionLoading === activeRequestId}
                    >
                      {isActionLoading === activeRequestId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Note'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 4: Success Dialog */}
      <Dialog open={processStep === ProcessStep.SUCCESS} onOpenChange={(isOpen) => !isOpen && resetProcessFlow()}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
              The request has been processed successfully.
            </p>
            <Button onClick={handleGoToCustomer}>
              Go to Customer
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note to this request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea 
              id="noteText" 
              placeholder="Enter your note here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddNote} 
              disabled={!noteText.trim() || isActionLoading === noteRequestId}
            >
              {isActionLoading === noteRequestId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update the status of this request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as RequestStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RequestStatus.NEW}>New</SelectItem>
                <SelectItem value={RequestStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={RequestStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={RequestStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange} 
              disabled={!selectedStatus || isActionLoading === statusRequestId}
            >
              {isActionLoading === statusRequestId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Play icon component
const Play = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export default NewRequests;