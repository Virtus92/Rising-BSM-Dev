'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building, FileText, 
  Calendar, RefreshCw, Tag, Bell, Globe, CreditCard, MessageSquare, User, Loader2,
  ChevronDown, CheckCircle2
} from 'lucide-react';
// Make sure we're using the client-side service
import { CustomerService } from '@/features/customers/lib/services/CustomerService.client';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { Button } from '@/shared/components/ui/button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/shared/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/shared/components/ui/card';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { NoPermissionView } from '@/shared/components/NoPermissionView';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/shared/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { Textarea } from '@/shared/components/ui/textarea';
import { Separator } from '@/shared/components/ui/separator';
import { useCustomerNotes } from '@/features/customers/hooks/useCustomerNotes';
import { formatDate } from '@/shared/utils/date-utils';
import { NotesTab } from '@/features/customers/components/NotesTab';
import { CustomerRequestsTab } from '@/features/customers/components/CustomerRequestsTab';
import { CustomerAppointmentsTab } from '@/features/customers/components/CustomerAppointmentsTab';

// Helper to get status badge styling
const getStatusBadge = (status: string) => {
  switch (status) {
    case CommonStatus.ACTIVE:
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case CommonStatus.INACTIVE:
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Inactive</Badge>;
    case CommonStatus.DELETED:
      return <Badge className="bg-red-500 hover:bg-red-600">Deleted</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// Helper to get customer type badge styling
const getTypeBadge = (type: string) => {
  switch (type) {
    case CustomerType.PRIVATE:
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Private</Badge>;
    case CustomerType.BUSINESS:
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Business</Badge>;
    case CustomerType.INDIVIDUAL:
      return <Badge variant="outline" className="border-green-500 text-green-500">Individual</Badge>;
    case CustomerType.GOVERNMENT:
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Government</Badge>;
    case CustomerType.NON_PROFIT:
      return <Badge variant="outline" className="border-pink-500 text-pink-500">Non-Profit</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

// Helper to get customer avatar initials
const getInitials = (name: string | undefined): string => {
  if (!name) return 'UN'; // UN for Unknown if no name provided
  
  return name
    .split(' ')
    .map(part => part?.[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export default function CustomerDetailsPage() {
  // Use the useParams hook to get route parameters in client components
  const params = useParams();
  const customerId = parseInt(params.id as string);
  const [customer, setCustomer] = useState<CustomerResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [changingStatus, setChangingStatus] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // Debug permissions loading state and get permission functions
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  // Use proper permission checks but wait until permissions are loaded
  const canViewCustomer = hasPermission(API_PERMISSIONS.CUSTOMERS.VIEW);
  const canEditCustomer = hasPermission(API_PERMISSIONS.CUSTOMERS.UPDATE);
  const canDeleteCustomer = hasPermission(API_PERMISSIONS.CUSTOMERS.DELETE);

  // Fetch customer details
  useEffect(() => {
    // Always try to fetch customer data, we'll handle permissions in UI
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await CustomerService.getCustomerById(customerId);
        
        if (response.success && response.data) {
          setCustomer(response.data);
          // Check if the user has the necessary permission after data is fetched
          if (!canViewCustomer) {
            console.warn('User lacks permission to view customer details');
            // We still set the customer data, but will render the permissions UI instead
          }
        } else {
          // Handle API error
          if (response.statusCode === 403) {
            // Permission error from API
            console.warn('API returned permission error 403');
          } else {
            // Other API error
            setError(response.message || 'Failed to fetch customer details');
          }
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError(typeof err === 'string' ? err : 'Failed to fetch customer details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [customerId, canViewCustomer]);

  // Handle customer status change
  const handleStatusChange = async (newStatus: CommonStatus) => {
    try {
      setChangingStatus(true);
      
      const response = await CustomerService.updateStatus(customerId, newStatus);
      
      if (response.success) {
        // Update customer state with new status
        setCustomer(prev => prev ? { ...prev, status: newStatus } : null);
        
        toast({
          title: 'Status updated',
          description: `Customer status changed to ${newStatus}`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'Update failed',
          description: response.message || 'Failed to update customer status',
          variant: 'error'
        });
      }
    } catch (err) {
      console.error('Error updating customer status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update customer status',
        variant: 'error'
      });
    } finally {
      setChangingStatus(false);
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    try {
      const response = await CustomerService.deleteCustomer(customerId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Customer has been deleted successfully',
          variant: 'success'
        });
        
        router.push('/dashboard/customers');
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete customer',
          variant: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'error'
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (permissionsLoading) {
    return <LoadingSpinner message="Loading permissions..." />;
  }

  if (!canViewCustomer) {
    return <NoPermissionView 
      title="Access Denied"
      message="You don't have permission to view customer details."
      permissionNeeded={API_PERMISSIONS.CUSTOMERS.VIEW}
    />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 text-center mb-4">{error}</p>
        <Link href="/dashboard/customers">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-center mb-4">Customer not found</p>
        <Link href="/dashboard/customers">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-4 max-w-7xl">
      {/* Top navigation and action buttons - improved for mobile */}
      <div className="space-y-4 pb-6">
        {/* Back button */}
        <div className="flex">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
        
        {/* Customer name and status badge - better wrapping on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold mr-2">{customer.name}</h1>
          <div className="mt-0.5">{getStatusBadge(customer.status)}</div>
        </div>
        
        {/* Action buttons - full width on mobile, row on desktop */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
          {canEditCustomer && (
            <Link href={`/dashboard/customers/${customerId}/edit`} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-9">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          
          {canEditCustomer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto h-9"
                  disabled={changingStatus}
                >
                  {changingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  )}
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {Object.values(CommonStatus).filter(status => [
                  CommonStatus.ACTIVE, 
                  CommonStatus.INACTIVE, 
                  CommonStatus.DELETED
                ].includes(status as CommonStatus)).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    disabled={customer?.status === status}
                    className={customer?.status === status ? 'bg-muted cursor-default' : ''}
                    onClick={() => customer?.status !== status && handleStatusChange(status as CommonStatus)}
                  >
                    {customer?.status === status && (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                    )}
                    <span className={customer?.status === status ? 'font-medium ml-6' : ''}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {canDeleteCustomer && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto h-9"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
      
      {/* Customer profile summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Avatar and basic info */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4 md:w-48">
            <Avatar className="h-24 w-24 text-lg">
              <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left md:text-center space-y-1">
              <h2 className="text-xl font-semibold">{customer.name}</h2>
              {customer.company && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{customer.company}</p>
              )}
              <div className="my-2">
                {getTypeBadge(customer.type)}
              </div>
            </div>
          </div>
          
          {/* Contact details */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              {customer.email ? (
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline dark:text-blue-400 truncate">
                    {customer.email}
                  </a>
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">Not provided</p>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
              {customer.phone ? (
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-green-500" />
                  <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline dark:text-blue-400">
                    {customer.phone}
                  </a>
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">Not provided</p>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">VAT/Tax ID</p>
              {customer.vatNumber ? (
                <p className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                  <span>{customer.vatNumber}</span>
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">Not provided</p>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Newsletter</p>
              <p className="flex items-center">
                <Bell className="h-4 w-4 mr-2 text-amber-500" />
                <span>{customer.newsletter ? 'Subscribed' : 'Not subscribed'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for customer details - 2 row layout */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col space-y-2">
          {/* First row of tabs */}
          <div className="overflow-x-auto pb-1">
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex w-full justify-center flex-nowrap">
              <TabsTrigger value="overview" className="rounded-md min-w-max">
                <FileText className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="rounded-md min-w-max">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Address</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-md min-w-max">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Notes</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Second row of tabs */}
          <div className="overflow-x-auto pb-1">
            <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex w-full justify-center flex-nowrap">
              <TabsTrigger value="requests" className="rounded-md min-w-max">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Requests</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-md min-w-max">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Appointments</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-md min-w-max">
                <User className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Activity</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* Overview tab content */}
        <TabsContent value="overview" className="mt-6 px-2 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Latest activity card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Customer Overview
                </CardTitle>
                <CardDescription>
                  Summary of customer details and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Customer info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</h3>
                    
                    {customer.email && (
                      <div className="flex items-start">
                        <Mail className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <a 
                            href={`mailto:${customer.email}`} 
                            className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
                          >
                            {customer.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {customer.phone && (
                      <div className="flex items-start">
                        <Phone className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <a 
                            href={`tel:${customer.phone}`} 
                            className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
                          >
                            {customer.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {customer.company && (
                      <div className="flex items-start">
                        <Building className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Company</p>
                          <p className="text-sm">{customer.company}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Address preview */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address Preview</h3>
                    
                    {(customer.address || customer.city || customer.postalCode || customer.country) ? (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Primary Address</p>
                          <address className="not-italic text-sm">
                            {customer.address && <p>{customer.address}</p>}
                            {(customer.postalCode || customer.city) && (
                              <p>
                                {customer.postalCode && <span>{customer.postalCode} </span>}
                                {customer.city && <span>{customer.city}</span>}
                              </p>
                            )}
                            {customer.country && <p>{customer.country}</p>}
                          </address>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic text-sm">No address information</p>
                    )}
                  </div>
                </div>
                
                {/* Notes section - replaced with a link to the Notes tab */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                      <p className="text-sm font-medium">Customer Notes</p>
                    </div>
                    <button 
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      onClick={() => setActiveTab('notes')}
                    >
                      View notes
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Customer metadata card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-blue-500" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    {getStatusBadge(customer.status)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                    {getTypeBadge(customer.type)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Newsletter</p>
                    <Badge variant={customer.newsletter ? "default" : "outline"}>
                      {customer.newsletter ? 'Subscribed' : 'Not subscribed'}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-sm font-medium flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-medium flex items-center">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      {new Date(customer.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Address tab content */}
        <TabsContent value="address" className="mt-6 px-2 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(customer.address || customer.city || customer.postalCode || customer.country) ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Address details */}
                    <div className="space-y-3">
                      {customer.address && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Street Address</p>
                          <p className="font-medium">{customer.address}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        {customer.postalCode && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</p>
                            <p className="font-medium">{customer.postalCode}</p>
                          </div>
                        )}
                        
                        {customer.city && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">City</p>
                            <p className="font-medium">{customer.city}</p>
                          </div>
                        )}
                      </div>
                      
                      {customer.country && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</p>
                          <p className="font-medium flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-gray-500" />
                            {customer.country}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Map placeholder - can be integrated with actual map in the future */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-40 md:h-64 flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Map view would be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Address Information</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    This customer doesn't have any address information saved.
                  </p>
                  {canEditCustomer && (
                    <Link href={`/dashboard/customers/${customerId}/edit`}>
                      <Button variant="outline" className="mt-4">
                        <Edit className="mr-2 h-4 w-4" />
                        Add address details
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Requests tab content */}
        <TabsContent value="requests" className="mt-6 px-2 sm:px-0">
          <CustomerRequestsTab customerId={customerId} />
        </TabsContent>
        
        {/* Notes tab content */}
        <TabsContent value="notes" className="mt-6 px-2 sm:px-0">
          <NotesTab customerId={customerId} />
        </TabsContent>
        
        {/* Appointments tab content */}
        <TabsContent value="appointments" className="mt-6 px-2 sm:px-0">
          {/* Only render CustomerAppointmentsTab when customer data is fully loaded */}
          {customer && customer.id && (
            <CustomerAppointmentsTab customerId={customerId} />
          )}
        </TabsContent>
        
        {/* Activity tab content */}
        <TabsContent value="activity" className="mt-6 px-2 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Activity History
              </CardTitle>
              <CardDescription>
                Recent activity and interactions with this customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="py-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Recent Activity</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  There is no recorded activity for this customer yet.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-800/50 flex justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Activity tracking is coming soon
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <DeleteConfirmationDialog
          title="Delete Customer"
          description={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
          onConfirm={handleDeleteCustomer}
          onClose={() => setShowDeleteDialog(false)}
          open={showDeleteDialog}
        />
      )}
    </div>
  );
}